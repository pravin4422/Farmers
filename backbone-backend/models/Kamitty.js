const mongoose = require('mongoose');

const KamittySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  numBags: { type: Number, default: 0 },     // ✅ use Number for calculations
  costPerBag: { type: Number, default: 0 },  // ✅ use Number for calculations
  otherCost: { type: Number, default: 0 },   // ✅ use Number for calculations
  totalKamitty: { type: Number, required: true }, // ✅ store as Number
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kamitty', KamittySchema);
