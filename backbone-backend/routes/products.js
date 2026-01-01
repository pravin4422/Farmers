const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const protect = require('../middleware/authMiddleware');

// POST: Add product
router.post('/', protect, async (req, res) => {
    try {
        const newProduct = new Product({
            ...req.body,
            user: req.user._id
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Get all products or filtered for logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const { month, year, date } = req.query;
        let query = { user: req.user._id };
        if (month) query.date = new RegExp(`^${year ? year : '\\d{4}'}-${month}`);
        if (date) query.date = date;
        const products = await Product.find(query).sort({ date: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Latest product for logged-in user
router.get('/latest', protect, async (req, res) => {
    try {
        const latest = await Product.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(latest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: Update product
router.put('/:id', protect, async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE: Delete product
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
