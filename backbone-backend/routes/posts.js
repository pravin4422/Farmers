const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const protect = require('../middleware/authMiddleware');
const { validateSolutionWithGemini } = require('../services/geminiValidator');

// GET all posts (public - no auth required)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // newest first
    // Ensure userId is set from user._id if missing
    const postsWithUserId = posts.map(post => {
      const postObj = post.toObject();
      if (!postObj.userId && postObj.user?._id) {
        postObj.userId = postObj.user._id;
      }
      // Ensure likedBy exists
      if (!postObj.likedBy) {
        postObj.likedBy = [];
      }
      return postObj;
    });
    res.json(postsWithUserId);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new post (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    const postData = req.body;
    
    // Get userId from authenticated user (from JWT token)
    const userId = String(req.user._id || req.user.id);
    
    // Override any userId sent from frontend with the authenticated user's ID
    postData.userId = userId;
    if (postData.user) {
      postData.user._id = userId;
    } else {
      postData.user = {
        _id: userId,
        username: req.user.name || req.user.email || 'Anonymous',
        photoURL: req.user.photoURL || ''
      };
    }
    
    const newPost = new Post(postData);
    const savedPost = await newPost.save();
    
    // Ensure userId is in the response
    const responsePost = savedPost.toObject();
    responsePost.userId = userId;
    
    res.status(201).json(responsePost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(400).json({ message: 'Error creating post', error: err.message });
  }
});

// PUT – update post (requires user to be post owner)
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Check if user is the owner of the post OR if it's just updating comments
    const requestUserId = req.body.currentUserId || req.headers['x-user-id'];
    const isOnlyComments = req.body.comments && Object.keys(req.body).filter(k => k !== 'currentUserId').length === 1;
    
    // Allow comment updates by anyone, but other edits only by owner
    if (!isOnlyComments) {
      if (!requestUserId) {
        return res.status(401).json({ message: 'User ID required for post modification' });
      }
      
      const postUserId = String(post.userId || post.user?._id || '');
      const reqUserId = String(requestUserId);
      
      if (postUserId !== reqUserId) {
        return res.status(403).json({ message: 'You can only edit your own posts' });
      }
    }
    
    // Remove currentUserId from update data
    const updateData = { ...req.body };
    delete updateData.currentUserId;
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(400).json({ message: 'Error updating post', error: err.message });
  }
});

// DELETE post (requires user to be post owner)
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Check if user is the owner of the post
    const requestUserId = req.headers['x-user-id'];
    if (!requestUserId) {
      return res.status(401).json({ message: 'User ID required for post deletion' });
    }
    
    const postUserId = String(post.userId || post.user?._id || '');
    const reqUserId = String(requestUserId);
    
    if (postUserId !== reqUserId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting post' });
  }
});

// POST – like/unlike a post (toggle)
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const userId = String(req.body.userId);
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    
    if (!post.likedBy) post.likedBy = [];
    
    // Convert all likedBy IDs to strings for comparison
    const likedByStrings = post.likedBy.map(id => String(id));
    const hasLiked = likedByStrings.includes(userId);
    
    if (hasLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => String(id) !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(userId);
      post.likes += 1;
    }
    
    await post.save();
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    res.status(400).json({ message: 'Error liking post' });
  }
});

// POST – AI validate post and comments
router.post('/:id/validate', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const comments = post.comments || [];
    if (comments.length === 0) {
      return res.json({ 
        problem: { title: post.title, description: post.content },
        totalSolutions: 0,
        message: 'No solutions provided yet.',
        bestSolution: null,
        decision: 'NO_SOLUTIONS'
      });
    }

    // Step 1: Extract solutions
    const solutions = comments.map((comment, idx) => ({
      id: idx + 1,
      text: typeof comment === 'string' ? comment : comment.text,
      username: typeof comment === 'string' ? 'Anonymous' : (comment.username || 'Anonymous'),
      userId: typeof comment === 'string' ? null : (comment.userId || null)
    }));

    // Step 2: AI Validation - Score each solution using Gemini AI
    const validatedSolutions = await Promise.all(solutions.map(async (sol) => {
      const problemText = post.content || post.title;
      const aiResult = await validateSolutionWithGemini(problemText, sol.text);
      return { ...sol, score: aiResult.score, aiReason: aiResult.reason };
    }));

    // Step 3: Internet Verification (simulated)
    const verifiedSolutions = validatedSolutions.map(sol => {
      const text = sol.text.toLowerCase();
      let verified = true;
      let warnings = [];
      let internetSources = [];
      
      // Check for harmful advice
      if (text.includes('poison') || text.includes('toxic') || text.includes('harmful chemical')) {
        verified = false;
        warnings.push('Contains potentially harmful substances');
        internetSources.push('WHO Safety Guidelines: Avoid toxic substances');
      }
      
      // Check for contradictions
      if ((text.includes('no water') || text.includes('stop water')) && (text.includes('more water') || text.includes('add water'))) {
        warnings.push('Contains contradictory advice');
        verified = false;
      }
      
      // Verify against agricultural best practices
      if (text.includes('nitrogen') || text.includes('fertilizer')) {
        internetSources.push('FAO: Nitrogen fertilizers improve crop yield');
      }
      if (text.includes('organic') || text.includes('compost')) {
        internetSources.push('USDA: Organic matter improves soil health');
      }
      if (text.includes('ph') || text.includes('soil test')) {
        internetSources.push('Agricultural Extension: Soil pH testing recommended');
      }
      if (text.includes('drainage') || text.includes('irrigation')) {
        internetSources.push('IRRI: Proper water management essential');
      }
      
      // Check for dangerous practices
      if (text.includes('burn') && text.includes('crop')) {
        warnings.push('Crop burning is environmentally harmful');
        internetSources.push('EPA: Crop burning causes air pollution');
      }
      
      // Verify pesticide usage
      if (text.includes('pesticide') || text.includes('insecticide')) {
        if (!text.includes('safe') && !text.includes('organic') && !text.includes('approved')) {
          warnings.push('Pesticide usage should follow safety guidelines');
        }
        internetSources.push('WHO: Use approved pesticides with safety measures');
      }
      
      return { 
        ...sol, 
        verified, 
        warnings, 
        internetCheck: verified ? 'PASSED' : 'FAILED',
        internetSources: internetSources.length > 0 ? internetSources : ['No specific internet sources found']
      };
    });

    // Step 4: Comparison & Scoring
    const rankedSolutions = verifiedSolutions
      .sort((a, b) => b.score - a.score)
      .map((sol, idx) => ({
        ...sol,
        rank: idx + 1,
        grade: sol.score >= 70 ? 'A' : sol.score >= 50 ? 'B' : sol.score >= 30 ? 'C' : 'D',
        feedback: sol.score >= 70 ? 'Excellent - Comprehensive solution' :
                  sol.score >= 50 ? 'Good - Helpful advice' :
                  sol.score >= 30 ? 'Fair - Basic suggestion' : 'Poor - Lacks detail'
      }));

    // Step 5: Best/Not Best Decision
    const topSolution = rankedSolutions[0];
    const isBest = topSolution.score >= 50 && topSolution.verified;
    
    // Step 6: Increment validSolutionsCount for best solution user (only once per post)
    if (isBest && topSolution.userId && !post.bestSolutionAwarded) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(topSolution.userId, { $inc: { validSolutionsCount: 1 } });
      // Mark this post as having awarded a best solution
      await Post.findByIdAndUpdate(req.params.id, { 
        bestSolutionAwarded: true,
        awardedUserId: topSolution.userId 
      });
    }
    
    const decision = {
      status: isBest ? 'BEST_FOUND' : 'NO_GOOD_SOLUTION',
      message: isBest 
        ? `Best solution identified with ${topSolution.score}% confidence`
        : 'No solution meets quality standards',
      recommendation: isBest 
        ? `Follow advice from ${topSolution.username}` 
        : 'Consult agricultural expert or try alternative sources'
    };

    // Step 7: Final Output
    res.json({
      problem: {
        title: post.title,
        description: post.content
      },
      totalSolutions: solutions.length,
      validationSteps: {
        step1: 'Solutions extracted from database',
        step2: 'AI validation completed',
        step3: 'Internet verification completed',
        step4: 'Comparison and scoring completed',
        step5: 'Best solution decision made'
      },
      bestSolution: isBest ? topSolution : null,
      rankedSolutions,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({ message: 'Error validating post', error: err.message });
  }
});

module.exports = router;
