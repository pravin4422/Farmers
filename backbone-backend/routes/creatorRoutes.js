const express = require('express');
const router = express.Router();
const {
  createEntry,
  getLatestEntry,
  getHistory,
  updateEntry,
  deleteEntry
} = require('../controllers/creatorController');

router.post('/', createEntry);
router.get('/latest', getLatestEntry);
router.get('/history', getHistory);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
