const mongoose = require("mongoose");
const Tractor = require("../models/Tractor");

// ✅ Add entry
exports.addTractor = async (req, res) => {
  try {
    const newTractor = new Tractor({
      ...req.body,
      user: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newTractor.save();
    res.status(201).json(newTractor);
  } catch (err) {
    res.status(400).json({ message: "Error adding tractor entry", error: err.message });
  }
};

// ✅ Get all entries for logged-in user with season/year filtering
exports.getTractors = async (req, res) => {
  try {
    const { season, year } = req.query;
    let filter = { user: req.user._id };
    
    if (season) filter.season = season;
    if (year) filter.year = parseInt(year);
    
    const tractors = await Tractor.find(filter).sort({ createdAt: -1 });
    res.json(tractors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tractor entries", error: err.message });
  }
};

// ✅ Get latest entry for logged-in user with season/year filtering
exports.getLatestTractor = async (req, res) => {
  try {
    const { season, year } = req.query;
    let filter = { user: req.user._id };
    
    if (season && year) {
      filter.season = season;
      filter.year = parseInt(year);
    }
    
    const latestTractor = await Tractor.findOne(filter).sort({ createdAt: -1 });
    if (!latestTractor) {
      return res.status(404).json({ message: "No tractor entries found" });
    }
    res.json(latestTractor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest tractor entry", error: err.message });
  }
};

// ✅ Get history with filters for logged-in user
exports.getTractorHistory = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let filter = { user: req.user._id };

    if (date) {
      filter.date = date;
    } else if (month) {
      filter.date = { $regex: `^${month}` };
    } else if (year) {
      filter.date = { $regex: `^${year}` };
    }

    const tractors = await Tractor.find(filter).sort({ createdAt: -1 });
    res.json(tractors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tractor history", error: err.message });
  }
};

// ✅ Update entry (only if belongs to logged-in user)
exports.updateTractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Tractor ID" });
    }

    const updatedTractor = await Tractor.findOneAndUpdate(
      { _id: id, user: req.user._id },
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

// ✅ Delete entry (only if belongs to logged-in user)
exports.deleteTractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Tractor ID" });
    }

    const deletedTractor = await Tractor.findOneAndDelete({ _id: id, user: req.user._id });

    if (!deletedTractor) {
      return res.status(404).json({ message: "Tractor entry not found" });
    }

    res.json({ message: "Tractor entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tractor entry", error: err.message });
  }
};
