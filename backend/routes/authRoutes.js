const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');

const { JWT_SECRET } = require('../utils/config');
const pool = require('../db');
const { sanitizeInput, isValidPassword, isValidEmail } = require('../utils/helper');

/**
 * Fetches a user from the database by username.
 *
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

/**
 * POST /login
 * Authenticates a user with username and password.
 * Returns a partial JWT token for 2FA setup or verification.
 */
router.post('/login', async (req, res) => {
  try {
    const email = sanitizeInput(req.body.email, { maxLength: 100 });
    const password = sanitizeInput(req.body.password, { maxLength: 128 });

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Fetch user by email
    const user = await getUserByEmail(email);
    if (!user || !user.enabled) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const next = user.totp_secret ? "verify-2fa" : "setup-2fa";

    return res.json({ success: true, token, next });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /create
 * Creates a new user account.
 * Validates email, confirmEmail, password, and inserts the user into the database.
 * Returns a partial JWT token for initial 2FA setup.
 */
router.post('/create', async (req, res) => {
  try {
    const email = sanitizeInput(req.body.email, { maxLength: 100 });
    const confirmEmail = sanitizeInput(req.body.confirmEmail, { maxLength: 100 });
    const password = sanitizeInput(req.body.password, { maxLength: 128 });

    if (!email || !confirmEmail || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Validate email format
    if (!isValidEmail(email) || !isValidEmail(confirmEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check that email and confirmEmail match
    if (email !== confirmEmail) {
      return res.status(400).json({ message: "Emails do not match" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 chars and include uppercase, lowercase, number, special char."
      });
    }

    // Check if email already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, enabled, login_count, first_login)
       VALUES ($1, $2, true, 0, true)
       RETURNING id, email`,
      [email, hash]
    );

    const { id } = result.rows[0];

    const token = jwt.sign(
      { id, email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ success: true, token, next: "setup-2fa" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});


/**
 * GET /verify
 * Verifies a partial JWT token.
 * Returns a simple valid/invalid response.
 */
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ valid: false });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query("SELECT id FROM users WHERE id = $1", [decoded.id]);

    res.json({ valid: result.rowCount > 0 });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;