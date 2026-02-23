const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cropExperience: { type: String, required: true },
  isAgriculturalOfficer: { type: Boolean, required: true },
  validSolutionsCount: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
