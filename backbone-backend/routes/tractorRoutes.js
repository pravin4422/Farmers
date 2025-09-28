const express = require("express");
const router = express.Router();
const Tractor = require("../models/Tractor");
const { Parser } = require("json2csv");

// Get all tractors
router.get("/", async (req, res) => {
    try {
        const tractors = await Tractor.find();
        res.json(tractors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new tractor
router.post("/", async (req, res) => {
    try {
        const tractor = new Tractor(req.body);
        tractor.history.push({ action: "created", data: req.body });
        await tractor.save();
        res.status(201).json(tractor);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update tractor
router.put("/:id", async (req, res) => {
    try {
        const tractor = await Tractor.findById(req.params.id);
        if (!tractor) return res.status(404).json({ message: "Tractor not found" });

        // Push history before updating
        tractor.history.push({ action: "updated", data: req.body });

        Object.assign(tractor, req.body);
        await tractor.save();
        res.json(tractor);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete tractor
router.delete("/:id", async (req, res) => {
    try {
        const tractor = await Tractor.findByIdAndDelete(req.params.id);
        if (!tractor) return res.status(404).json({ message: "Tractor not found" });
        res.json({ message: "Tractor deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export CSV
router.get("/export/csv", async (req, res) => {
    try {
        const tractors = await Tractor.find();
        const fields = ["_id", "name", "type", "status", "createdAt"];
        const parser = new Parser({ fields });
        const csv = parser.parse(tractors);
        res.header("Content-Type", "text/csv");
        res.attachment("tractors.csv");
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
