const { isAdminUser } = require('../validators/solutionValidators');

const adminAccessMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const isAdmin = await isAdminUser(userId);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating admin access', error: error.message });
  }
};

module.exports = { adminAccessMiddleware };
