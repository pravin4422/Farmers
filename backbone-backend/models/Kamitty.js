const mongoose = require('mongoose');

const KamittySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  numBags: { type: String, default: '0' }, // ✅ Changed to String to match frontend
  costPerBag: { type: String, default: '0' }, // ✅ Changed to String to match frontend
  otherCost: { type: String, default: '0' }, // ✅ Changed to String to match frontend
  totalKamitty: { type: String, required: true }, // ✅ Changed from total to totalKamitty
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kamitty', KamittySchema);