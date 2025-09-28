const express = require("express");
const router = express.Router();
const {
  addKamitty,
  getKamitty,
  getLatestKamitty,
  getKamittyHistory,
  updateKamitty,
  deleteKamitty
} = require("../controllers/kamittyController");

// POST /api/kamitty
router.post("/", addKamitty);

// GET /api/kamitty
router.get("/", getKamitty);

// GET /api/kamitty/latest
router.get("/latest", getLatestKamitty);

// GET /api/kamitty/history
router.get("/history", getKamittyHistory);

// PUT /api/kamitty/:id
router.put("/:id", updateKamitty);

// DELETE /api/kamitty/:id
router.delete("/:id", deleteKamitty);

module.exports = router; // ✅ Must export the router directly
