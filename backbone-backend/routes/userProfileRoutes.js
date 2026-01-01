const express = require('express');
const router = express.Router();
const { createProfile, getProfile, updateProfile, getProfileByUserId } = require('../controllers/userProfileController');
const authMiddleware = require('../middleware/authMiddleware');

// Use authMiddleware directly
router.post('/', authMiddleware, createProfile);
router.get('/', authMiddleware, getProfile);
router.get('/:userId', authMiddleware, getProfileByUserId);
router.put('/', authMiddleware, updateProfile);

module.exports = router;
