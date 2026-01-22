const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    name: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.pre('validate', function(next) {
    this.total = this.quantity * this.cost;
    next();
}); 
module.exports = mongoose.model('Product', productSchema);
