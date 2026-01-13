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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get latest entry for logged-in user (optionally filtered by season/year)
exports.getLatestEntry = async (req, res) => {
  try {
    const { season, year } = req.query;
    let filter = { user: req.user._id };
    
    // If season and year are provided, filter by them
    if (season && year) {
      filter.season = season;
      filter.year = parseInt(year);
    }
    
    const latestEntry = await Creator.findOne(filter).sort({ createdAt: -1 });
    if (!latestEntry) return res.status(404).json({ message: 'No entries found' });
    res.status(200).json(latestEntry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get history with optional filter for logged-in user
exports.getHistory = async (req, res) => {
  try {
    const { season, year, day } = req.query;
    let filter = { user: req.user._id }; // Filter by logged-in user

    if (season) filter.season = season;
    if (year) filter.year = parseInt(year);
    if (day) {
      // Filter by day of week from seedDate
      const entries = await Creator.find(filter).sort({ createdAt: -1 });
      const filteredEntries = entries.filter(entry => {
        if (entry.seedDate) {
          const dayOfWeek = new Date(entry.seedDate).toLocaleDateString('en-US', { weekday: 'long' });
          return dayOfWeek === day;
        }
        return false;
      });
      return res.status(200).json(filteredEntries);
    }

    const entries = await Creator.find(filter).sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (err) {
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
