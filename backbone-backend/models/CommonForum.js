const mongoose = require('mongoose');

const commonForumSchema = new mongoose.Schema({
  crop: { type: String, required: true },
  season: { type: String, required: true },
  sowing: { type: String, required: true },
  harvest: { type: String, required: true },
  tips: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  question: { type: String },
  questionAudio: { type: String },
  solutions: [{ 
    userName: String, 
    solution: String, 
    solutionAudio: String, 
    aiScore: Number,
    aiReason: String,
    createdAt: { type: Date, default: Date.now } 
  }],
  validatedSolution: { 
    solution: String, 
    solutionAudio: String,
    pros: String, 
    prosAudio: String,
    cons: String,
    consAudio: String,
    validatedBy: String, 
    validatedAt: Date,
    aiScore: Number,
    aiReason: String
  },
  status: { type: String, enum: ['open', 'validated'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  CommonForum: mongoose.model('CommonForum', commonForumSchema),
  Discussion: mongoose.model('Discussion', discussionSchema)
};
