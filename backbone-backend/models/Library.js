const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  problemTitle: { type: String },
  category: { type: String, required: true },
  severity: { type: String, required: true },
  description: { type: String, required: true },
  solution: { type: String, required: true },
  cropAffected: { type: String },
  symptoms: { type: String, required: true },
  symptomsVoice: { type: String },
  descriptionVoice: { type: String },
  solutionVoice: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Library', librarySchema);
