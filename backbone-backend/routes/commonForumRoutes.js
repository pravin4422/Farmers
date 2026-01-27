const express = require('express');
const router = express.Router();
const { CommonForum, Discussion } = require('../models/CommonForum');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', async (req, res) => {
  try {
    const posts = await CommonForum.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyAdmin, async (req, res) => {
  try {
    const post = new CommonForum(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await CommonForum.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/discussions', async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discussions', verifyToken, async (req, res) => {
  try {
    const discussion = new Discussion(req.body);
    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/discussions/:id/reply', verifyAdmin, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { reply: req.body.reply },
      { new: true }
    );
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discussions/:id/solution', verifyToken, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (discussion.solutions.length >= 10) {
      return res.status(400).json({ message: 'Maximum 10 solutions reached' });
    }
    discussion.solutions.push({ userName: req.body.userName, solution: req.body.solution });
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discussions/:id/validate', verifyAdmin, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { 
        validatedSolution: { 
          solution: req.body.solution,
          pros: req.body.pros,
          cons: req.body.cons,
          validatedBy: 'Admin', 
          validatedAt: new Date() 
        },
        status: 'validated'
      },
      { new: true }
    );
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/validated-post', verifyAdmin, async (req, res) => {
  try {
    const post = new Discussion({
      userName: 'Admin',
      question: req.body.problem,
      questionAudio: req.body.problemAudio,
      solutions: [],
      validatedSolution: {
        solution: req.body.solution,
        solutionAudio: req.body.solutionAudio,
        pros: req.body.pros,
        prosAudio: req.body.prosAudio,
        cons: req.body.cons,
        consAudio: req.body.consAudio,
        validatedBy: 'Admin',
        validatedAt: new Date()
      },
      status: 'validated'
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/validated', async (req, res) => {
  try {
    const validated = await Discussion.find({ status: 'validated' }).sort({ 'validatedSolution.validatedAt': -1 });
    res.json(validated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/validated/:id', verifyAdmin, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      {
        question: req.body.problem,
        questionAudio: req.body.problemAudio,
        'validatedSolution.solution': req.body.solution,
        'validatedSolution.solutionAudio': req.body.solutionAudio,
        'validatedSolution.pros': req.body.pros,
        'validatedSolution.prosAudio': req.body.prosAudio,
        'validatedSolution.cons': req.body.cons,
        'validatedSolution.consAudio': req.body.consAudio
      },
      { new: true }
    );
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/validated/:id', verifyAdmin, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/discussions/:id', verifyAdmin, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
