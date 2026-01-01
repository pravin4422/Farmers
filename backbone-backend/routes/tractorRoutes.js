const express = require("express");
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { 
  addTractor, 
  getTractors, 
  getLatestTractor, 
  getTractorHistory, 
  updateTractor, 
  deleteTractor 
} = require("../controllers/tractorController");

// Apply auth middleware to all routes
router.post("/", protect, addTractor);
router.get("/", protect, getTractors);
router.get("/latest", protect, getLatestTractor);
router.get("/history", protect, getTractorHistory);
router.put("/:id", protect, updateTractor);
router.delete("/:id", protect, deleteTractor);

module.exports = router;