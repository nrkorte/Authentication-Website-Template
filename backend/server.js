const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticateUser } = require('./middleware/auth');

// Utilities
const { JWT_SECRET, PORT } = require('./utils/config');
const { sanitizeInput, isValidPassword } = require('./utils/helper');
const pool = require('./db'); // <- import centralized DB pool

// Routes
const authRoutes = require('./routes/authRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');

// ------------------- App setup -------------------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// ------------------- Middleware & Routes -------------------
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);

// ------------------- Start server -------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ------------------- Exports -------------------
module.exports = {
  pool
};
