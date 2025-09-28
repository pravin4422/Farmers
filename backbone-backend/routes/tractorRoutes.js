const express = require("express");
const router = express.Router();
const { 
  addTractor, 
  getTractors, 
  getLatestTractor, 
  getTractorHistory, 
  updateTractor, 
  deleteTractor 
} = require("../controllers/tractorController");

// POST /api/tractor
router.post("/", addTractor);

// GET /api/tractor
router.get("/", getTractors);

// GET /api/tractors/latest - ✅ Added missing endpoint
router.get("/latest", getLatestTractor);

// GET /api/tractor/history - ✅ Added missing endpoint
router.get("/history", getTractorHistory);

// PUT /api/tractor/:id - ✅ Added missing endpoint
router.put("/:id", updateTractor);

// DELETE /api/tractor/:id - ✅ Added missing endpoint
router.delete("/:id", deleteTractor);

module.exports = router;