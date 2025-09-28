const mongoose = require('mongoose');

const SeedingTakerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  taken: { type: Number, required: true },
  money: { type: Number, required: true },
});

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  moneyGiven: { type: String, enum: ['yes', 'no'], default: 'yes' },
  cost: { type: Number, required: true },
});

const CreatorSchema = new mongoose.Schema({
  seedDate: { type: Date, required: true },
  seedWeight: { type: Number },
  seedCost: { type: Number },
  seedingCount: { type: Number },
  peopleCount: { type: Number },
  moneyPerPerson: { type: Number },
  totalSeedingCost: { type: Number },
  seedingTakers: [SeedingTakerSchema],
  plantingDate: { type: Date },
  workers: [WorkerSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Creator', CreatorSchema);
