const mongoose = require('mongoose');

const expirySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Other'],
    default: 'Other'
  },
  notes: {
    type: String,
    trim: true
  },
  season: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
expirySchema.index({ userId: 1, expiryDate: 1 });

module.exports = mongoose.model('Expiry', expirySchema);