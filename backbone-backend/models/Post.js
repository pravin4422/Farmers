const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  files: { type: Array, default: [] },
  comments: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String },
  user: {
    _id: { type: String },
    username: { type: String, default: 'Guest User' },
    photoURL: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
