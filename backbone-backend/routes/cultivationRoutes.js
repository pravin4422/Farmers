const express = require('express');
const router = express.Router();
const CultivationActivity = require('../models/CultivationActivity');

// GET all with optional filters
router.get('/', async (req, res) => {
  try {
    const { month, year, date, search } = req.query;
    let filter = {};

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

// GET latest entry
router.get('/latest', async (req, res) => {
  try {
    const latest = await CultivationActivity.findOne().sort({ createdAt: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new activity
router.post('/', async (req, res) => {
  try {
    const activity = new CultivationActivity(req.body);
    const saved = await activity.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  try {
    const updated = await CultivationActivity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE activity
router.delete('/:id', async (req, res) => {
  try {
    await CultivationActivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
