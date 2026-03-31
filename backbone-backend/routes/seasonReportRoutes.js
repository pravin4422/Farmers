const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getLatestReport,
  updateReport,
  deleteReport
} = require('../controllers/seasonReportController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createReport);
router.get('/', protect, getReports);
router.get('/latest', protect, getLatestReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
