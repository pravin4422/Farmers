const mongoose = require('mongoose');

const TractorSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  day: { type: String, required: true }, // ✅ Added day field
  work: { type: String, required: true }, // ✅ Changed from workType to work
  tractorName: { type: String, required: true }, // ✅ Changed from name to tractorName
  timeSegments: [{ // ✅ Added timeSegments array
    period: { type: String, required: true }, // Morning, Afternoon, Evening, Night
    hours: { type: Number, required: true }
  }],
  totalHours: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
  moneyGiven: { type: String, enum: ['Okay', 'Not'], default: 'Not' }, // ✅ Changed to string
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false // We're handling timestamps manually
});

module.exports = mongoose.model('Tractor', TractorSchema);