const Kamitty = require('../models/Kamitty');

// Add entry
exports.addKamitty = async (req, res) => {
  try {
    const newKamitty = new Kamitty({
      ...req.body,
      user: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await newKamitty.save();
    res.status(201).json(newKamitty);
  } catch (err) {
    res.status(400).json({ message: 'Error adding kamitty entry', error: err.message });
  }
};

// Get all entries for logged-in user with season/year filtering
exports.getKamitty = async (req, res) => {
  try {
    const { season, year } = req.query;
    let filter = { user: req.user._id };
    
    if (season) filter.season = season;
    if (year) filter.year = parseInt(year);
    
    const kamitty = await Kamitty.find(filter).sort({ createdAt: -1 });
    res.json(kamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching kamitty entries', error: err.message });
  }
};

// Get latest entry for logged-in user with season/year filtering
exports.getLatestKamitty = async (req, res) => {
  try {
    const { season, year } = req.query;
    let filter = { user: req.user._id };
    
    if (season && year) {
      filter.season = season;
      filter.year = parseInt(year);
    }
    
    const latestKamitty = await Kamitty.findOne(filter).sort({ createdAt: -1 });
    if (!latestKamitty) {
      return res.status(404).json({ message: 'No kamitty entries found' });
    }
    res.json(latestKamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching latest kamitty entry', error: err.message });
  }
};

// Get history with filters for logged-in user
exports.getKamittyHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = { user: req.user._id };

    if (date) {
      filter.date = date;
    } else if (month) {
      const [yearPart, monthPart] = month.split('-');
      const startDate = new Date(yearPart, monthPart - 1, 1);
      const endDate = new Date(yearPart, monthPart, 1);
      filter.date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
    } else if (year) {
      filter.date = { $regex: `^${year}` };
    }

    const kamitty = await Kamitty.find(filter).sort({ createdAt: -1 });
    res.json(kamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching kamitty history', error: err.message });
  }
};

// Update entry (only if belongs to logged-in user)
exports.updateKamitty = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedKamitty = await Kamitty.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { ...req.body, updatedAt: new Date() }, 
      { new: true }
    );
    
    if (!updatedKamitty) {
      return res.status(404).json({ message: 'Kamitty entry not found' });
    }
    
    res.json(updatedKamitty);
  } catch (err) {
    res.status(400).json({ message: 'Error updating kamitty entry', error: err.message });
  }
};

// Delete entry (only if belongs to logged-in user)
exports.deleteKamitty = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedKamitty = await Kamitty.findOneAndDelete({ _id: id, user: req.user._id });
    
    if (!deletedKamitty) {
      return res.status(404).json({ message: 'Kamitty entry not found' });
    }
    
    res.json({ message: 'Kamitty entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting kamitty entry', error: err.message });
  }
};