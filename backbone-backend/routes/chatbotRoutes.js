const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { chat, getChatHistory, clearChatHistory } = require('../controllers/chatbotController');

router.post('/chat', authMiddleware, chat);
router.get('/history', authMiddleware, getChatHistory);
router.delete('/history', authMiddleware, clearChatHistory);

module.exports = router;
