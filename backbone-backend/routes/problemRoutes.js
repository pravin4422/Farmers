const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createProblem,
  getProblems,
  deleteProblem,
  updateProblem
} = require('../controllers/problemController');

// All routes require authentication
router.use(authMiddleware);

router.post('/', createProblem);
router.get('/', getProblems);
router.put('/:id', updateProblem);
router.delete('/:id', deleteProblem);

module.exports = router;
