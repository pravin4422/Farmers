const express = require('express');
const router = express.Router();

// Import all controller functions
const {
  signup,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Import auth middleware (to verify JWT)
const { protect } = require('../middleware/authMiddleware');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ✅ Example: a protected test route (you can remove later)
router.get('/me', protect, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});

module.exports = router;
