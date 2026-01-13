const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Problem'
  },
  description: {
    type: String
  },
  audioPath: {
    type: String
  },
  season: {
    type: String
  },
  year: {
    type: Number
  }
}, {
  timestamps: true
});

problemSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Problem', problemSchema);
