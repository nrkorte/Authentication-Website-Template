const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../utils/config');
const { sanitizeInput, isValidPassword } = require('../utils/helper');

/**
 * Middleware to enforce full authentication (e.g., 2FA) for a route.
 * Checks if the user object on the request has `fullAuth` set to true.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
function requireFullAuth(req, res, next) {
  if (!req.user || !req.user.fullAuth) {
    return res.status(401).json({ message: "2FA verification required" });
  }
  next();
}

/**
 * Middleware to authenticate a user via JWT token in the Authorization header.
 * Verifies the token, sanitizes payload data, fetches user data from the database,
 * and attaches a sanitized user object to `req.user`.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = Number(decoded.id);
    const username = sanitizeInput(decoded.username, { maxLength: 50 });

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Malformed token payload" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.enabled) {
      return res.status(403).json({ message: "Account disabled" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role || "user",
      fullAuth: decoded.fullAuth || false
    };

    next();
  } catch {
    res.status(500).json({ message: "Server error during authentication" });
  }
}

module.exports = {
  authenticateUser,
  requireFullAuth
};