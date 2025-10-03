const express = require('express');
const router = express.Router();

// Import all controller functions
const {
  createEntry,
  getLatestEntry,
  getHistory,
  updateEntry,
  deleteEntry
} = require('../controllers/creatorController');

// ✅ Import auth middleware
const protect = require('../middleware/authMiddleware'); // ✅ fixed import

// ✅ Apply protect middleware to all routes
router.post('/', protect, createEntry);
router.get('/latest', protect, getLatestEntry);
router.get('/history', protect, getHistory);
router.put('/:id', protect, updateEntry);
router.delete('/:id', protect, deleteEntry);

module.exports = router;
