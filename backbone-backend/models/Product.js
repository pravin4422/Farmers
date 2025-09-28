const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    date: { type: String, required: true },
    day: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    cost: { type: Number, required: true },
    total: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
