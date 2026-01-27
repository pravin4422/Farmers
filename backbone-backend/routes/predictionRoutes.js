const express = require('express');
const router = express.Router();
const multer = require('multer');
const { predictCrop, predictYield, predictDisease } = require('../controllers/predictionController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/crop', authMiddleware, predictCrop);
router.post('/yield', authMiddleware, predictYield);
router.post('/disease', authMiddleware, upload.single('image'), predictDisease);

module.exports = router;
