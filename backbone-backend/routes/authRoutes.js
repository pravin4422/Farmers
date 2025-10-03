const express = require('express');
const router = express.Router();

// Import all controller functions
const authController = require('../controllers/authController');

// Destructure the controller functions
const { signup, login, forgotPassword, resetPassword } = authController;

// Import auth middleware (to verify JWT)
const protect = require('../middleware/authMiddleware'); // ✅ fixed import

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ✅ Protected test route
router.get('/me', protect, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});

module.exports = router;
