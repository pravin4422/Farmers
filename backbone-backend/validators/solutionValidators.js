const UserProfile = require('../models/UserProfile');

// Validator 1: Agricultural Officer with Education Experience
const validateAgriculturalOfficer = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return false;
    return Boolean(
      profile.agriEducationExperience && 
      profile.agriEducationExperience > 0 && 
      profile.age >= 25 && 
      profile.agricultureExperience >= 3 && 
      profile.mainCrop && 
      profile.address
    );
  } catch (error) {
    return false;
  }
};

// Validator 2: Senior Experienced Farmer (40+ years age with high experience)
const validateSeniorExpert = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return false;
    return Boolean(
      profile.age >= 40 && 
      profile.agricultureExperience >= 10 && 
      profile.mainCrop && 
      profile.address
    );
  } catch (error) {
    return false;
  }
};

// Validator 3: Crop Expert (Farmers grouped by crop expertise)
const validateCropExpert = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return false;
    return Boolean(
      profile.mainCrop && 
      profile.agricultureExperience >= 10 && 
      profile.age >= 30 && 
      profile.address
    );
  } catch (error) {
    return false;
  }
};

// Check if user qualifies as admin (any of the three validators)
const isAdminUser = async (userId) => {
  try {
    const officer = await validateAgriculturalOfficer(userId);
    const senior = await validateSeniorExpert(userId);
    const cropExpert = await validateCropExpert(userId);
    const result = officer || senior || cropExpert;
    return Boolean(result);
  } catch (error) {
    console.error('Error in isAdminUser:', error);
    return false;
  }
};

module.exports = {
  validateAgriculturalOfficer,
  validateSeniorExpert,
  validateCropExpert,
  isAdminUser
};
