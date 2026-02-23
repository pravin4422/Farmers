const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  category: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  image: { type: String },
  details: {
    launch: { type: String },
    objective: { type: String },
    benefit: { type: String },
    eligibility: { type: String },
    apply: { type: String },
    documents: { type: String },
    website: { type: String },
    applicationMode: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);
