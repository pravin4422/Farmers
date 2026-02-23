const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const auth = require('../middleware/authMiddleware');

// Get all schemes (public - all users can see)
router.get('/all', async (req, res) => {
  try {
    const schemes = await Scheme.find().sort({ createdAt: -1 });
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new scheme (authenticated)
router.post('/add', auth, async (req, res) => {
  try {
    const newScheme = new Scheme({ ...req.body, userId: req.user.id });
    const savedScheme = await newScheme.save();
    res.status(201).json(savedScheme);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update scheme (authenticated)
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedScheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedScheme) return res.status(404).json({ error: 'Scheme not found' });
    res.json(updatedScheme);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
