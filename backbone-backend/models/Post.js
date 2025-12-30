const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  user: {
    username: { type: String, default: 'Guest User' },
    photoURL: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
