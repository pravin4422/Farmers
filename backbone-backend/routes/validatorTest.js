const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateAgriculturalOfficer, validateSeniorExpert, validateCropExpert } = require('../validators/solutionValidators');

router.get('/check-admin-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const officer = await validateAgriculturalOfficer(userId);
    const senior = await validateSeniorExpert(userId);
    const cropExpert = await validateCropExpert(userId);
    
    res.json({
      isAgriculturalOfficer: officer,
      isSeniorExpert: senior,
      isCropExpert: cropExpert,
      isAdmin: officer || senior || cropExpert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
