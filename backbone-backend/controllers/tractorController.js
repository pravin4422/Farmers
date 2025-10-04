const mongoose = require("mongoose");
const Tractor = require("../models/Tractor");

// ✅ Add entry
exports.addTractor = async (req, res) => {
  try {
    const newTractor = new Tractor({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newTractor.save();
    res.status(201).json(newTractor);
  } catch (err) {
    res.status(400).json({ message: "Error adding tractor entry", error: err.message });
  }
};

// ✅ Get all entries
exports.getTractors = async (req, res) => {
  try {
    const tractors = await Tractor.find().sort({ createdAt: -1 });
    res.json(tractors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tractor entries", error: err.message });
  }
};

// ✅ Get latest entry
exports.getLatestTractor = async (req, res) => {
  try {
    const latestTractor = await Tractor.findOne().sort({ createdAt: -1 });
    if (!latestTractor) {
      return res.status(404).json({ message: "No tractor entries found" });
    }
    res.json(latestTractor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest tractor entry", error: err.message });
  }
};

// ✅ Get history with filters
exports.getTractorHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = {};

    if (date) {
      // Specific date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (month) {
      // Month filter YYYY-MM
      const [yearPart, monthPart] = month.split("-");
      const startDate = new Date(yearPart, monthPart - 1, 1);
      const endDate = new Date(yearPart, monthPart, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (year) {
      // Year filter
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const tractors = await Tractor.find(filter).sort({ createdAt: -1 });
    res.json(tractors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tractor history", error: err.message });
  }
};

// ✅ Update entry
exports.updateTractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Tractor ID" });
    }

    const updatedTractor = await Tractor.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedTractor) {
      return res.status(404).json({ message: "Tractor entry not found" });
    }

    res.json(updatedTractor);
  } catch (err) {
    res.status(400).json({ message: "Error updating tractor entry", error: err.message });
  }
};

// ✅ Delete entry
exports.deleteTractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Tractor ID" });
    }

    const deletedTractor = await Tractor.findByIdAndDelete(id);

    if (!deletedTractor) {
      return res.status(404).json({ message: "Tractor entry not found" });
    }

    res.json({ message: "Tractor entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tractor entry", error: err.message });
  }
};
