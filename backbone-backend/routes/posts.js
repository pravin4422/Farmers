const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const protect = require('../middleware/authMiddleware');

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
      return postObj;
    });
    res.json(postsWithUserId);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new post (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    const postData = req.body;
    
    // Get userId from authenticated user (from JWT token)
    const userId = req.user._id || req.user.id;
    console.log('Creating post for authenticated user:', userId);
    
    // Override any userId sent from frontend with the authenticated user's ID
    postData.userId = userId;
    if (postData.user) {
      postData.user._id = userId;
    }
    
    const newPost = new Post(postData);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(400).json({ message: 'Error creating post' });
  }
});

// PUT – update post (requires user to be post owner)
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Check if user is the owner of the post
    const requestUserId = req.body.currentUserId || req.headers['x-user-id'];
    if (!requestUserId) {
      return res.status(401).json({ message: 'User ID required for post modification' });
    }
    
    if (post.userId !== requestUserId && post.user?._id !== requestUserId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error updating post' });
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
    
    if (post.userId !== requestUserId && post.user?._id !== requestUserId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    const deleted = await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error deleting post' });
  }
});

// POST – like a post (public - no auth required)
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    post.likes += 1;
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error liking post' });
  }
});

module.exports = router;
