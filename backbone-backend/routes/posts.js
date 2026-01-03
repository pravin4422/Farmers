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
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new post (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    const postData = req.body;
    
    // Get userId from authenticated user (from JWT token)
    const userId = String(req.user._id || req.user.id);
    
    console.log('Creating post - User ID from token:', userId);
    console.log('User object:', req.user);
    
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
    
    console.log('Post saved with userId:', responsePost.userId);
    
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
    
    // Check if user is the owner of the post OR if it's just adding a comment
    const requestUserId = req.body.currentUserId || req.headers['x-user-id'];
    const isAddingComment = req.body.comments && req.body.comments.length > (post.comments?.length || 0);
    const isOnlyComments = req.body.comments && Object.keys(req.body).filter(k => k !== 'currentUserId').length === 1;
    
    // Allow comment additions by anyone, but other edits only by owner
    if (!isAddingComment || !isOnlyComments) {
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

// POST – like a post (public - no auth required)
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    post.likes += 1;
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(400).json({ message: 'Error liking post' });
  }
});

module.exports = router;
