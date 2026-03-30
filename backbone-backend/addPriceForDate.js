const mongoose = require('mongoose');
const Price = require('./models/Price');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/backbone')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Add a price entry for a specific date
 * Usage: node addPriceForDate.js
 */

const addPriceForDate = async () => {
  try {
    // Example: Add Rice price for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const priceEntry = {
      commodity: 'Rice',
      market: 'Chennai',
      state: 'Tamil Nadu',
      min_price: 2100,
      max_price: 2400,
      arrival_date: yesterday
      // No userId = Government data
      // Add userId: new mongoose.Types.ObjectId() for user entry
    };

    const saved = await Price.create(priceEntry);
    console.log('✅ Price added successfully:', saved);
    
    // Show summary
    const riceCount = await Price.countDocuments({ commodity: 'Rice' });
    console.log(`\n📊 Total Rice entries in database: ${riceCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding price:', error);
    process.exit(1);
  }
};

// Bulk add prices for multiple dates
const addBulkPrices = async (commodity, days = 7) => {
  try {
    console.log(`🌱 Adding ${days} days of ${commodity} prices...`);
    
    const prices = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Random price variation
      const baseMin = 2000;
      const baseMax = 2500;
      const variation = 1 + (Math.random() * 0.1 - 0.05);
      
      prices.push({
        commodity: commodity,
        market: 'Chennai',
        state: 'Tamil Nadu',
        min_price: Math.round(baseMin * variation),
        max_price: Math.round(baseMax * variation),
        arrival_date: date
      });
    }
    
    await Price.insertMany(prices);
    console.log(`✅ Added ${prices.length} price entries for ${commodity}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding bulk prices:', error);
    process.exit(1);
  }
};

// Command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: Add single entry for yesterday
  addPriceForDate();
} else if (args[0] === 'bulk') {
  // Usage: node addPriceForDate.js bulk Rice 7
  const commodity = args[1] || 'Rice';
  const days = parseInt(args[2]) || 7;
  addBulkPrices(commodity, days);
} else {
  console.log('Usage:');
  console.log('  node addPriceForDate.js              - Add single entry for yesterday');
  console.log('  node addPriceForDate.js bulk Rice 7  - Add 7 days of Rice prices');
  process.exit(0);
}
