const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // Mandatory fields
  agricultureExperience: { type: Number, required: true, min: 0 },
  age: { type: Number, required: true, min: 18 },
  address: { type: String, required: true },
  mainCrop: { type: String, required: true },
  // Optional fields
  landSize: { type: Number, min: 0 },
  educationQualification: { type: String },
  agriEducationExperience: { type: Number, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
