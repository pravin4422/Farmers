const mongoose = require('mongoose');

const kamittySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  season: { type: String },
  year: { type: Number },
  date: { type: String, required: true },
  description: { type: String },
  numBags: { type: String },
  costPerBag: { type: String },
  otherCost: { type: String },
  totalKamitty: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Kamitty', kamittySchema);