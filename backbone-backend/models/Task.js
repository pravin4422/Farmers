const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
