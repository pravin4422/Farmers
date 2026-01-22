const Price = require('../models/Price');
const axios = require('axios');

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

// Fetch external government market prices
exports.getExternalPrices = async (req, res) => {
  try {
    const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070', {
      params: {
        'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
        format: 'json',
        limit: 100
      }
    });
    
    const records = response.data.records.map(record => ({
      commodity: record.commodity,
      market: record.market,
      state: record.state,
      min_price: record.min_price,
      max_price: record.max_price,
      arrival_date: record.arrival_date
    }));
    
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
