/**
 * Sanitizes a string input to remove potentially unsafe characters.
 * Can enforce maximum length and specific types such as 'number' or 'email'.
 *
 * @param {string} input - The input string to sanitize.
 * @param {Object} [options] - Optional settings for sanitization.
 * @param {number} [options.maxLength] - Maximum allowed length of the string.
 * @param {string} [options.type] - Type of input: 'number' or 'email'.
 * @returns {string} The sanitized string.
 * @throws {Error} If type is 'email' and the format is invalid.
 */
function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') return '';
  let sanitized = input.trim();
  sanitized = sanitized.replace(/[<>\/\\'"`%;()&+]/g, '');

  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  if (options.type === 'number') {
    sanitized = sanitized.replace(/[^0-9]/g, '');
  } else if (options.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
  }

  return sanitized;
}

/**
 * Validates a password for strength requirements.
 * Requires at least 8 characters, including uppercase, lowercase, number, and special character.
 *
 * @param {string} password - The password string to validate.
 * @returns {boolean} True if password meets requirements, false otherwise.
 */
function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
}

/**
 * Checks if a string is a valid email address.
 * @param {string} email - The email to validate.
 * @returns {boolean} - True if valid email, false otherwise.
 */
function isValidEmail(email) {
  if (typeof email !== "string") return false;

  // Simple regex for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

module.exports = {
  sanitizeInput,
  isValidPassword,
  isValidEmail
};
