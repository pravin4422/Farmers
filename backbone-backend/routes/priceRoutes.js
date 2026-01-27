const express = require('express');
const router = express.Router();
const Price = require('../models/Price');
const axios = require('axios');
const auth = require('../middleware/authMiddleware');

// Get user's prices
router.get('/my-prices', auth, async (req, res) => {
  try {
    const prices = await Price.find({ userId: req.user.id }).sort({ arrival_date: -1 });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new price
router.post('/add', auth, async (req, res) => {
  try {
    const newPrice = new Price({ ...req.body, userId: req.user.id });
    const savedPrice = await newPrice.save();
    res.status(201).json(savedPrice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete price by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const price = await Price.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!price) return res.status(404).json({ error: 'Price not found' });
    res.json({ message: 'Price deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Proxy for external API to avoid CORS
router.get('/external', async (req, res) => {
  try {
    const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070', {
      params: {
        'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
        'format': 'json',
        'limit': 100
      },
      timeout: 15000
    });
    res.json(response.data);
  } catch (err) {
    res.json({ records: [] });
  }
});

module.exports = router;
