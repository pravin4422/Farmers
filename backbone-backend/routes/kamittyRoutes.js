const express = require("express");
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  addKamitty,
  getKamitty,
  getLatestKamitty,
  getKamittyHistory,
  updateKamitty,
  deleteKamitty
} = require("../controllers/kamittyController");

// Apply auth middleware to all routes
router.post("/", protect, addKamitty);
router.get("/", protect, getKamitty);
router.get("/latest", protect, getLatestKamitty);
router.get("/history", protect, getKamittyHistory);
router.put("/:id", protect, updateKamitty);
router.delete("/:id", protect, deleteKamitty);

module.exports = router;
