const express = require('express');
const router = express.Router();
const Price = require('../models/Price');

// Get all user prices
router.get('/my-prices', async (req, res) => {
  try {
    const prices = await Price.find().sort({ arrival_date: -1 });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new price
router.post('/add', async (req, res) => {
  try {
    const { commodity, market, state, min_price, max_price, arrival_date } = req.body;

    const newPrice = new Price({
      commodity,
      market,
      state,
      min_price,
      max_price,
      arrival_date
    });

    const savedPrice = await newPrice.save();
    res.status(201).json(savedPrice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete price by ID
router.delete('/:id', async (req, res) => {
  try {
    const price = await Price.findById(req.params.id);
    if (!price) return res.status(404).json({ error: 'Price not found' });

    await price.remove();
    res.json({ message: 'Price deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
