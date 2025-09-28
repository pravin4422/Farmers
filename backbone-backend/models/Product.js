const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    date: { type: String, required: true },
    day: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    cost: { type: Number, required: true },
    total: { type: Number, required: true }
}, { timestamps: true });

productSchema.pre('validate', function(next) {
    this.total = this.quantity * this.cost;
    next();
}); 
module.exports = mongoose.model('Product', productSchema);
