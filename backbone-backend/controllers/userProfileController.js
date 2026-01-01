const UserProfile = require('../models/UserProfile');

exports.createProfile = async (req, res) => {
  try {
    const { agricultureExperience, age, address, mainCrop, landSize, educationQualification, agriEducationExperience } = req.body;
    
    const userId = req.user._id || req.user.id || req.userId;
    
    const existingProfile = await UserProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    const profile = new UserProfile({
      userId,
      agricultureExperience,
      age,
      address,
      mainCrop,
      landSize,
      educationQualification,
      agriEducationExperience
    });

    await profile.save();
    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Error creating profile', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const profile = await UserProfile.findOne({ userId }).populate('userId', 'name email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('getProfileByUserId called with userId:', userId);
    console.log('Logged in user:', req.user?._id || req.user?.id);
    
    const profile = await UserProfile.findOne({ userId }).populate('userId', 'name email');
    console.log('Found profile:', profile ? 'Yes' : 'No');
    
    if (!profile) {
      // If no profile exists, still return basic user info
      const User = require('../models/User');
      const user = await User.findById(userId).select('name email');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ 
        userId: { _id: userId, name: user.name, email: user.email },
        noProfile: true 
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('Get profile by userId error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
