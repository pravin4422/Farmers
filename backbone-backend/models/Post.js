const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, default: 'Voice Message' },
  content: { type: String, default: 'Voice Message' },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  files: { type: Array, default: [] },
  voiceMessage: { type: String, default: null },
  titleVoiceMessage: { type: String, default: null },
  comments: { type: mongoose.Schema.Types.Mixed, default: [] },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String },
  user: {
    _id: { type: String },
    username: { type: String, default: 'Guest User' },
    photoURL: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
