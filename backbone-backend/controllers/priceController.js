const Price = require('../models/Price');

// Fetch all prices
exports.getAllPrices = async (req, res) => {
  try {
    const prices = await Price.find().sort({ arrival_date: -1 });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new price
exports.addPrice = async (req, res) => {
  try {
    const newPrice = new Price(req.body);
    const savedPrice = await newPrice.save();
    res.status(201).json(savedPrice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a price by ID
exports.deletePrice = async (req, res) => {
  try {
    const deleted = await Price.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Price entry not found' });
    res.json({ message: 'Price deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
