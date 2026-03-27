const express = require('express');
const router = express.Router();
const priceAnalysisController = require('../controllers/priceAnalysisController');
const auth = require('../middleware/authMiddleware');

router.post('/analyze', auth, priceAnalysisController.analyzePriceTrends);
router.post('/compare', auth, priceAnalysisController.compareCommodities);

module.exports = router;
