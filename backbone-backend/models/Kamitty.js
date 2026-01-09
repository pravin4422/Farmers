const mongoose = require('mongoose');

const KamittySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  numBags: { type: Number, default: 0 },
  costPerBag: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  totalKamitty: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kamitty', KamittySchema);
