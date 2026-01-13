const Expiry = require('../models/Expiry');

// Get all expiries for the authenticated user
const getExpiries = async (req, res) => {
  try {
    const expiries = await Expiry.find({ userId: req.user.id })
      .sort({ expiryDate: 1 }); // Sort by expiry date (earliest first)
    
    res.json(expiries);
  } catch (error) {
    console.error('Error fetching expiries:', error);
    res.status(500).json({ message: 'Server error while fetching expiries' });
  }
};

// Create a new expiry
const createExpiry = async (req, res) => {
  try {
    const { productName, expiryDate, category, notes, season, year } = req.body;

    // Validation
    if (!productName || !expiryDate) {
      return res.status(400).json({ message: 'Product name and expiry date are required' });
    }

    const expiry = new Expiry({
      userId: req.user.id,
      productName,
      expiryDate,
      category,
      notes,
      season: season || null,
      year: year ? parseInt(year) : null
    });

    const savedExpiry = await expiry.save();
    res.status(201).json(savedExpiry);
  } catch (error) {
    console.error('Error creating expiry:', error);
    res.status(500).json({ message: 'Server error while creating expiry' });
  }
};

// Update an expiry
const updateExpiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, expiryDate, category, notes, season, year } = req.body;

    // Find expiry and check ownership
    const expiry = await Expiry.findOne({ _id: id, userId: req.user.id });
    if (!expiry) {
      return res.status(404).json({ message: 'Expiry not found' });
    }

    // Update fields
    if (productName !== undefined) expiry.productName = productName;
    if (expiryDate !== undefined) expiry.expiryDate = expiryDate;
    if (category !== undefined) expiry.category = category;
    if (notes !== undefined) expiry.notes = notes;
    if (season !== undefined) expiry.season = season || null;
    if (year !== undefined) expiry.year = year ? parseInt(year) : null;

    const updatedExpiry = await expiry.save();
    res.json(updatedExpiry);
  } catch (error) {
    console.error('Error updating expiry:', error);
    res.status(500).json({ message: 'Server error while updating expiry' });
  }
};

// Delete an expiry
const deleteExpiry = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete expiry (check ownership)
    const expiry = await Expiry.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!expiry) {
      return res.status(404).json({ message: 'Expiry not found' });
    }

    res.json({ message: 'Expiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting expiry:', error);
    res.status(500).json({ message: 'Server error while deleting expiry' });
  }
};

// Get expiring soon items (within 30 days)
const getExpiringSoon = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await Expiry.find({
      userId: req.user.id,
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    }).sort({ expiryDate: 1 });

    res.json(expiringSoon);
  } catch (error) {
    console.error('Error fetching expiring soon items:', error);
    res.status(500).json({ message: 'Server error while fetching expiring items' });
  }
};

module.exports = {
  getExpiries,
  createExpiry,
  updateExpiry,
  deleteExpiry,
  getExpiringSoon
};