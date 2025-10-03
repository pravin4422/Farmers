const Creator = require('../models/Creator');

// Create new entry
exports.createEntry = async (req, res) => {
  try {
    const newEntry = new Creator({
      ...req.body,
      user: req.user._id // Attach logged-in user
    });

    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    console.error("Create Entry Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get latest entry for logged-in user
exports.getLatestEntry = async (req, res) => {
  try {
    const latestEntry = await Creator.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!latestEntry) return res.status(404).json({ message: 'No entries found' });
    res.status(200).json(latestEntry);
  } catch (err) {
    console.error("Get Latest Entry Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get history with optional filter for logged-in user
exports.getHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = { user: req.user._id }; // Filter by logged-in user

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
    console.error("Get History Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update entry (only if it belongs to logged-in user)
exports.updateEntry = async (req, res) => {
  try {
    const updatedEntry = await Creator.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedEntry) return res.status(404).json({ message: 'Entry not found' });

    res.status(200).json(updatedEntry);
  } catch (err) {
    console.error("Update Entry Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete entry (only if it belongs to logged-in user)
exports.deleteEntry = async (req, res) => {
  try {
    const deletedEntry = await Creator.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedEntry) return res.status(404).json({ message: 'Entry not found' });
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error("Delete Entry Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
