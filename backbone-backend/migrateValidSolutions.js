// Migration script to add validSolutionsCount to existing users
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Update all users to have validSolutionsCount = 0 if not set
    const result = await User.updateMany(
      { validSolutionsCount: { $exists: false } },
      { $set: { validSolutionsCount: 0 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with validSolutionsCount = 0`);
    
    // Verify
    const users = await User.find({}, 'name email validSolutionsCount');
    console.log('\n📊 All users:');
    users.forEach(user => {
      console.log(`  - ${user.name}: validSolutionsCount = ${user.validSolutionsCount}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateUsers();
