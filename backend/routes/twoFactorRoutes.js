const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const pool = require('../db');
const { sanitizeInput } = require('../utils/helper');
const { JWT_SECRET } = require('../utils/config');

/**
 * Fetches a user from the database by email.
 *
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

/**
 * POST /setup
 * Sets up 2FA for a user.
 * Generates a TOTP secret if not already present and returns a QR code and secret.
 */
router.post('/setup', async (req, res) => {
  try {
    const token = sanitizeInput(req.body.token);
    if (!token) return res.status(400).json({ message: "Missing token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserByEmail(decoded.email);

    if (!user) return res.status(404).json({ message: "User not found" });

    let secret;
    if (!user.totp_secret) {
      secret = speakeasy.generateSecret({
        name: `2FA Code (${user.email})`,
        length: 20
      });

      await pool.query(
        "UPDATE users SET totp_secret = $1 WHERE id = $2",
        [secret.base32, user.id]
      );
    } else {
      secret = {
        base32: user.totp_secret,
        otpauth_url: speakeasy.otpauthURL({
          secret: user.totp_secret,
          label: `2FA Code (${user.email})`,
          encoding: "base32"
        })
      };
    }

    const qr = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qr, secret: secret.base32 });
  } catch (err) {
    console.error("2FA SETUP ERROR:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

/**
 * POST /verify
 * Verifies a user's 2FA code.
 * Issues a full session JWT token if the code is valid.
 */
router.post('/verify', async (req, res) => {
  try {
    const token = sanitizeInput(req.body.token);
    const code = sanitizeInput(req.body.code);

    if (!token || !code) return res.status(400).json({ message: "Missing fields" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserByEmail(decoded.email);

    if (!user) return res.status(404).json({ message: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) return res.status(401).json({ message: "Invalid code" });

    const fullToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ success: true, token: fullToken, next: "dashboard" });
  } catch (err) {
    console.error("2FA VERIFY ERROR:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
