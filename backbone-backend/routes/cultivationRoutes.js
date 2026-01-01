const express = require('express');
const router = express.Router();
const CultivationActivity = require('../models/CultivationActivity');
const protect = require('../middleware/authMiddleware');

// GET all with optional filters for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const { month, year, date, search } = req.query;
    let filter = { user: req.user._id };

    if (date) filter.date = date;
    if (month) filter.date = { $regex: `^${month}` }; // YYYY-MM
    if (year) filter.date = { $regex: `^${year}` };   // YYYY
    if (search) filter.title = { $regex: search, $options: 'i' };

    const activities = await CultivationActivity.find(filter).sort({ date: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET latest entry for logged-in user
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await CultivationActivity.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new activity
router.post('/', protect, async (req, res) => {
  try {
    const activity = new CultivationActivity({
      ...req.body,
      user: req.user._id
    });
    const saved = await activity.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update activity
router.put('/:id', protect, async (req, res) => {
  try {
    const updated = await CultivationActivity.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE activity
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await CultivationActivity.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
