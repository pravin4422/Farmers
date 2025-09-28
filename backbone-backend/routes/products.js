const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST: Add product
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Get all products or filtered
router.get('/', async (req, res) => {
    try {
        const { month, year, date } = req.query;
        let query = {};
        if (month) query.date = new RegExp(`^${year ? year : '\\d{4}'}-${month}`);
        if (date) query.date = date;
        const products = await Product.find(query).sort({ date: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Latest product
router.get('/latest', async (req, res) => {
    try {
        const latest = await Product.findOne().sort({ createdAt: -1 });
        res.json(latest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: Update product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE: Delete product
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
