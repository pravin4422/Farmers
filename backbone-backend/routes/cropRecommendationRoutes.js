const express = require('express');
const router = express.Router();
const { recommendBestCrop, predictFutureCrop } = require('../controllers/cropRecommendationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/recommend', authMiddleware, recommendBestCrop);
router.post('/predict-future', authMiddleware, predictFutureCrop);

module.exports = router;
