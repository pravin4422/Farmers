const mongoose = require('mongoose');

const TimeSegmentSchema = new mongoose.Schema({
  period: { type: String, required: true },
  hours: { type: Number, required: true }
});

const OwnerSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone1: String,
  phone2: String
});

const CultivationActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  note: { type: String, required: true },
  date: { type: String, required: true },
  driver: String,
  owner: OwnerSchema,
  timeSegments: [TimeSegmentSchema],
  rate: Number,
  totalHours: Number,
  total: Number,
}, { timestamps: true });

module.exports = mongoose.model('CultivationActivity', CultivationActivitySchema);
