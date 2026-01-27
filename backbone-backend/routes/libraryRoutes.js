const express = require('express');
const router = express.Router();
const { getProblems, addProblem, deleteProblem } = require('../controllers/libraryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/problems', authMiddleware, getProblems);
router.post('/add', authMiddleware, addProblem);
router.delete('/:id', authMiddleware, deleteProblem);

module.exports = router;
