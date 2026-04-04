const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { isAdminUser, validateAgriculturalOfficer, validateSeniorExpert, validateCropExpert } = require('./validators/solutionValidators');
const UserProfile = require('./models/UserProfile');
const User = require('./models/User');

dotenv.config();

const testAdminStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user ID from command line or use a default
    const userIdArg = process.argv[2];
    
    if (!userIdArg) {
      console.log('Usage: node testAdminStatus.js <userId>');
      console.log('\nListing all user profiles:');
      const profiles = await UserProfile.find().populate('userId');
      profiles.forEach(profile => {
        console.log(`\nUser ID: ${profile.userId._id}`);
        console.log(`Email: ${profile.userId.email}`);
        console.log(`Name: ${profile.userId.name}`);
        console.log(`Agriculture Experience: ${profile.agricultureExperience} years`);
        console.log(`Age: ${profile.age}`);
        console.log(`Main Crop: ${profile.mainCrop}`);
        console.log(`Address: ${profile.address}`);
        console.log(`Agri Education Experience: ${profile.agriEducationExperience || 0} years`);
      });
      await mongoose.connection.close();
      return;
    }

    const userId = userIdArg;
    const profile = await UserProfile.findOne({ userId }).populate('userId');
    
    if (!profile) {
      console.log('❌ No profile found for this user ID');
      await mongoose.connection.close();
      return;
    }

    console.log('📋 User Profile:');
    console.log(`Email: ${profile.userId.email}`);
    console.log(`Name: ${profile.userId.name}`);
    console.log(`Agriculture Experience: ${profile.agricultureExperience} years`);
    console.log(`Age: ${profile.age}`);
    console.log(`Main Crop: ${profile.mainCrop}`);
    console.log(`Address: ${profile.address}`);
    console.log(`Agri Education Experience: ${profile.agriEducationExperience || 0} years`);
    console.log(`Land Size: ${profile.landSize || 'N/A'}`);
    console.log(`Education: ${profile.educationQualification || 'N/A'}`);

    console.log('\n🔍 Checking Admin Criteria:\n');

    // Test Agricultural Officer
    const isOfficer = await validateAgriculturalOfficer(userId);
    console.log('1️⃣ Agricultural Officer (with education experience):');
    console.log(`   Requirements: Age ≥ 25, Agri Experience ≥ 3, Agri Education > 0, Main Crop, Address`);
    console.log(`   ✓ Age ≥ 25: ${profile.age >= 25 ? '✅' : '❌'} (${profile.age})`);
    console.log(`   ✓ Agri Experience ≥ 3: ${profile.agricultureExperience >= 3 ? '✅' : '❌'} (${profile.agricultureExperience})`);
    console.log(`   ✓ Agri Education > 0: ${profile.agriEducationExperience > 0 ? '✅' : '❌'} (${profile.agriEducationExperience || 0})`);
    console.log(`   ✓ Main Crop: ${profile.mainCrop ? '✅' : '❌'} (${profile.mainCrop || 'N/A'})`);
    console.log(`   ✓ Address: ${profile.address ? '✅' : '❌'} (${profile.address ? 'Yes' : 'No'})`);
    console.log(`   Result: ${isOfficer ? '✅ QUALIFIED' : '❌ NOT QUALIFIED'}\n`);

    // Test Senior Expert
    const isSenior = await validateSeniorExpert(userId);
    console.log('2️⃣ Senior Expert (Age 40+ with 10+ years experience):');
    console.log(`   Requirements: Age ≥ 40, Agri Experience ≥ 10, Main Crop, Address`);
    console.log(`   ✓ Age ≥ 40: ${profile.age >= 40 ? '✅' : '❌'} (${profile.age})`);
    console.log(`   ✓ Agri Experience ≥ 10: ${profile.agricultureExperience >= 10 ? '✅' : '❌'} (${profile.agricultureExperience})`);
    console.log(`   ✓ Main Crop: ${profile.mainCrop ? '✅' : '❌'} (${profile.mainCrop || 'N/A'})`);
    console.log(`   ✓ Address: ${profile.address ? '✅' : '❌'} (${profile.address ? 'Yes' : 'No'})`);
    console.log(`   Result: ${isSenior ? '✅ QUALIFIED' : '❌ NOT QUALIFIED'}\n`);

    // Test Crop Expert
    const isCropExpert = await validateCropExpert(userId);
    console.log('3️⃣ Crop Expert (5+ years experience with main crop):');
    console.log(`   Requirements: Agri Experience ≥ 5, Main Crop, Address`);
    console.log(`   ✓ Agri Experience ≥ 5: ${profile.agricultureExperience >= 5 ? '✅' : '❌'} (${profile.agricultureExperience})`);
    console.log(`   ✓ Main Crop: ${profile.mainCrop ? '✅' : '❌'} (${profile.mainCrop || 'N/A'})`);
    console.log(`   ✓ Address: ${profile.address ? '✅' : '❌'} (${profile.address ? 'Yes' : 'No'})`);
    console.log(`   Result: ${isCropExpert ? '✅ QUALIFIED' : '❌ NOT QUALIFIED'}\n`);

    // Final result
    const isAdmin = await isAdminUser(userId);
    console.log('═══════════════════════════════════════');
    console.log(`🎯 FINAL ADMIN STATUS: ${isAdmin ? '✅ ADMIN ACCESS GRANTED' : '❌ NO ADMIN ACCESS'}`);
    console.log('═══════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testAdminStatus();
