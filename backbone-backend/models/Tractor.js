const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    action: String,
    date: { type: Date, default: Date.now },
    data: Object
});

const tractorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String },
    status: { type: String, default: "active" },
    createdAt: { type: Date, default: Date.now },
    history: [historySchema]
});

module.exports = mongoose.model("Tractor", tractorSchema);
