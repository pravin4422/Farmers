const express = require('express');
const router = express.Router();
const { CommonForum, Discussion } = require('../models/CommonForum');
const jwt = require('jsonwebtoken');
const { adminAccessMiddleware } = require('../middleware/solutionValidator');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSolutionWithGroq } = require('../services/groqValidator');

// Helper function to decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

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

router.get('/', async (req, res) => {
  try {
    const posts = await CommonForum.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authMiddleware, adminAccessMiddleware, async (req, res) => {
  try {
    const post = new CommonForum(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminAccessMiddleware, async (req, res) => {
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
    
    // Decode HTML entities
    const decodedDiscussions = discussions.map(doc => {
      const obj = doc.toObject();
      if (obj.question) obj.question = decodeHtmlEntities(obj.question);
      if (obj.solutions) {
        obj.solutions = obj.solutions.map(sol => ({
          ...sol,
          solution: decodeHtmlEntities(sol.solution),
          aiReason: decodeHtmlEntities(sol.aiReason)
        }));
      }
      if (obj.validatedSolution?.solution) {
        obj.validatedSolution.solution = decodeHtmlEntities(obj.validatedSolution.solution);
      }
      if (obj.validatedSolution?.aiReason) {
        obj.validatedSolution.aiReason = decodeHtmlEntities(obj.validatedSolution.aiReason);
      }
      return obj;
    });
    
    res.json(decodedDiscussions);
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

router.post('/discussions/:id/reply', authMiddleware, adminAccessMiddleware, async (req, res) => {
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

    // AI Validation for user solutions
    const problemText = discussion.question || 'Audio-based problem (no text)';
    const solutionText = req.body.solution || 'Audio-based solution (no text)';
    const aiValidation = await validateSolutionWithGroq(problemText, solutionText);
    
    if (!aiValidation.isValid || aiValidation.score < 60) {
      return res.status(400).json({ 
        message: 'Solution quality too low', 
        aiScore: aiValidation.score,
        aiReason: aiValidation.reason 
      });
    }

    discussion.solutions.push({ 
      userName: req.body.userName, 
      solution: req.body.solution,
      aiScore: aiValidation.score,
      aiReason: aiValidation.reason
    });
    await discussion.save();
    res.json({ 
      ...discussion.toObject(), 
      aiValidation 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discussions/:id/validate', authMiddleware, adminAccessMiddleware, async (req, res) => {
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

router.post('/validated-post', authMiddleware, adminAccessMiddleware, async (req, res) => {
  try {
    // AI Validation using Groq
    const aiValidation = await validateSolutionWithGroq(req.body.problem, req.body.solution);
    
    if (!aiValidation.isValid || aiValidation.score < 70) {
      return res.status(400).json({ 
        message: 'AI validation failed', 
        aiScore: aiValidation.score,
        aiReason: aiValidation.reason 
      });
    }

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
        validatedAt: new Date(),
        aiScore: aiValidation.score,
        aiReason: aiValidation.reason
      },
      status: 'validated'
    });
    await post.save();
    res.status(201).json({ 
      ...post.toObject(), 
      aiValidation 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/validated', async (req, res) => {
  try {
    const validated = await Discussion.find({ status: 'validated' }).sort({ 'validatedSolution.validatedAt': -1 });
    
    // Decode HTML entities in the response
    const decodedValidated = validated.map(doc => {
      const obj = doc.toObject();
      if (obj.question) obj.question = decodeHtmlEntities(obj.question);
      if (obj.validatedSolution?.solution) {
        obj.validatedSolution.solution = decodeHtmlEntities(obj.validatedSolution.solution);
      }
      if (obj.validatedSolution?.pros) {
        obj.validatedSolution.pros = decodeHtmlEntities(obj.validatedSolution.pros);
      }
      if (obj.validatedSolution?.cons) {
        obj.validatedSolution.cons = decodeHtmlEntities(obj.validatedSolution.cons);
      }
      if (obj.validatedSolution?.aiReason) {
        obj.validatedSolution.aiReason = decodeHtmlEntities(obj.validatedSolution.aiReason);
      }
      return obj;
    });
    
    res.json(decodedValidated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/validated/:id', authMiddleware, adminAccessMiddleware, async (req, res) => {
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

router.delete('/validated/:id', authMiddleware, adminAccessMiddleware, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/discussions/:id', authMiddleware, adminAccessMiddleware, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check admin status endpoint
router.get('/check-admin', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { isAdminUser } = require('../validators/solutionValidators');
    const isAdmin = await isAdminUser(userId);
    res.json({ isAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message, isAdmin: false });
  }
});

module.exports = router;
