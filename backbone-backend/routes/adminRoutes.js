const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminAccessMiddleware } = require('../middleware/solutionValidator');

// Admin dashboard - only accessible by validated users
router.get('/dashboard', authMiddleware, adminAccessMiddleware, (req, res) => {
  res.json({ message: 'Welcome to admin dashboard', user: req.user });
});

// Admin can approve/manage forum solutions
router.post('/approve-solution/:id', authMiddleware, adminAccessMiddleware, (req, res) => {
  res.json({ message: 'Solution approved' });
});

module.exports = router;
