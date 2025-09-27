const express = require('express');
const router = express.Router();

// Import all controller functions
const {
  signup,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
