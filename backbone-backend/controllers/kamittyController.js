const Kamitty = require('../models/Kamitty');

// Add entry
exports.addKamitty = async (req, res) => {
  try {
    const newKamitty = new Kamitty(req.body);
    await newKamitty.save();
    res.status(201).json(newKamitty);
  } catch (err) {
    res.status(400).json({ message: 'Error adding kamitty entry', error: err.message });
  }
};

// Get all entries
exports.getKamitty = async (req, res) => {
  try {
    const kamitty = await Kamitty.find().sort({ createdAt: -1 });
    res.json(kamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching kamitty entries', error: err.message });
  }
};

// ✅ Get latest entry
exports.getLatestKamitty = async (req, res) => {
  try {
    const latestKamitty = await Kamitty.findOne().sort({ createdAt: -1 });
    if (!latestKamitty) {
      return res.status(404).json({ message: 'No kamitty entries found' });
    }
    res.json(latestKamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching latest kamitty entry', error: err.message });
  }
};

// ✅ Get history with filters
exports.getKamittyHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = {};

    if (date) {
      // Filter by specific date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (month) {
      // Filter by month (format: YYYY-MM)
      const [yearPart, monthPart] = month.split('-');
      const startDate = new Date(yearPart, monthPart - 1, 1);
      const endDate = new Date(yearPart, monthPart, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (year) {
      // Filter by year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const kamitty = await Kamitty.find(filter).sort({ createdAt: -1 });
    res.json(kamitty);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching kamitty history', error: err.message });
  }
};

// ✅ Update entry
exports.updateKamitty = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedKamitty = await Kamitty.findByIdAndUpdate(
      id, 
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

// ✅ Delete entry
exports.deleteKamitty = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedKamitty = await Kamitty.findByIdAndDelete(id);
    
    if (!deletedKamitty) {
      return res.status(404).json({ message: 'Kamitty entry not found' });
    }
    
    res.json({ message: 'Kamitty entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting kamitty entry', error: err.message });
  }
};