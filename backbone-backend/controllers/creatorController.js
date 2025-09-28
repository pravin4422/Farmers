const Creator = require('../models/Creator');

// Create new entry
exports.createEntry = async (req, res) => {
  try {
    const newEntry = new Creator(req.body);
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get latest entry
exports.getLatestEntry = async (req, res) => {
  try {
    const latestEntry = await Creator.findOne().sort({ createdAt: -1 });
    res.status(200).json(latestEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get history with optional filter
exports.getHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = {};

    if (date) filter.seedDate = new Date(date);
    if (month) {
      const [yearM, monthM] = month.split('-');
      const start = new Date(yearM, monthM - 1, 1);
      const end = new Date(yearM, monthM, 0, 23, 59, 59);
      filter.seedDate = { $gte: start, $lte: end };
    }
    if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      filter.seedDate = { $gte: start, $lte: end };
    }

    const entries = await Creator.find(filter).sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update entry
exports.updateEntry = async (req, res) => {
  try {
    const updatedEntry = await Creator.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.status(200).json(updatedEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete entry
exports.deleteEntry = async (req, res) => {
  try {
    await Creator.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
