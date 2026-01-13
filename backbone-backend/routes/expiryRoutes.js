const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getExpiries,
  createExpiry,
  updateExpiry,
  deleteExpiry,
  getExpiringSoon
} = require('../controllers/expiryController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/expiries - Get all expiries for user
router.get('/', getExpiries);

// POST /api/expiries - Create new expiry
router.post('/', createExpiry);

// PUT /api/expiries/:id - Update expiry
router.put('/:id', updateExpiry);

// DELETE /api/expiries/:id - Delete expiry
router.delete('/:id', deleteExpiry);

// GET /api/expiries/expiring-soon - Get items expiring within 30 days
router.get('/expiring-soon', getExpiringSoon);

module.exports = router;