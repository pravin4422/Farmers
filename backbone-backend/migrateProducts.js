const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the first user ID from your database
    const User = require('./models/User');
    const firstUser = await User.findOne();
    
    if (!firstUser) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }

    console.log('Using user:', firstUser.email);

    // Update all products without a user field
    const result = await Product.updateMany(
      { user: { $exists: false } },
      { $set: { user: firstUser._id } }
    );

    console.log(`Updated ${result.modifiedCount} products`);
    
    // Verify
    const products = await Product.find({ user: firstUser._id });
    console.log(`Total products for user: ${products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateProducts();
