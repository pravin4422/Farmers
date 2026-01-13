const mongoose = require('mongoose');

const TractorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  season: { type: String, required: true },
  year: { type: Number, required: true },
  date: { type: Date, required: true },
  day: { type: String, required: true },
  work: { type: String, required: true },
  tractorName: { type: String, required: true },
  timeSegments: [{
    period: { type: String, required: true },
    hours: { type: Number, required: true }
  }],
  totalHours: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
  moneyGiven: { type: String, enum: ['Okay', 'Not'], default: 'Not' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

module.exports = mongoose.model('Tractor', TractorSchema);