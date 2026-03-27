const express = require('express');
const router = express.Router();
const { autoSaveGovernmentPrices, cleanupOldPrices } = require('../services/priceAutoSaveService');
const auth = require('../middleware/authMiddleware');

// Manually trigger price sync
router.post('/sync-prices', auth, async (req, res) => {
  try {
    await autoSaveGovernmentPrices();
    res.json({ message: 'Price sync completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Price sync failed', error: error.message });
  }
});

// Manually trigger cleanup
router.post('/cleanup-prices', auth, async (req, res) => {
  try {
    await cleanupOldPrices();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});

module.exports = router;
