const mongoose = require('mongoose');
const Price = require('./models/Price');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/backbone')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Demo: Add a NEW commodity with historical data
 * This will automatically appear in the Price Graph Analysis dropdown!
 */

const addNewCommodityWithHistory = async (commodityName, days = 14) => {
  try {
    console.log(`\n🌱 Adding NEW commodity: "${commodityName}" with ${days} days of history...`);
    
    // Check if commodity already exists
    const existing = await Price.findOne({ 
      commodity: new RegExp(`^${commodityName}$`, 'i') 
    });
    
    if (existing) {
      console.log(`⚠️  "${commodityName}" already exists in database`);
      console.log('   Adding more historical data anyway...');
    }
    
    const prices = [];
    const today = new Date();
    
    // Generate random base prices based on commodity type
    const priceRanges = {
      'Mango': { min: 40, max: 80 },
      'Banana': { min: 30, max: 60 },
      'Carrot': { min: 25, max: 50 },
      'Cabbage': { min: 20, max: 40 },
      'Chilli': { min: 60, max: 120 },
      'Garlic': { min: 80, max: 150 },
      'Ginger': { min: 100, max: 200 },
      'Brinjal': { min: 20, max: 45 },
      'Cauliflower': { min: 30, max: 60 },
      'Cucumber': { min: 15, max: 35 }
    };
    
    const basePrice = priceRanges[commodityName] || { min: 50, max: 100 };
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Add realistic price variation (±15%)
      const variation = 1 + (Math.random() * 0.3 - 0.15);
      const trendFactor = 1 + (i / 200); // Slight upward trend
      
      const minPrice = Math.round(basePrice.min * variation * trendFactor);
      const maxPrice = Math.round(basePrice.max * variation * trendFactor);
      
      prices.push({
        commodity: commodityName,
        market: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'][Math.floor(Math.random() * 4)],
        state: 'Tamil Nadu',
        min_price: minPrice,
        max_price: maxPrice,
        arrival_date: date
      });
      
      // Add some user entries (20% chance)
      if (Math.random() > 0.8) {
        prices.push({
          userId: new mongoose.Types.ObjectId(),
          commodity: commodityName,
          market: ['Chennai', 'Coimbatore'][Math.floor(Math.random() * 2)],
          state: 'Tamil Nadu',
          min_price: Math.round(minPrice * 1.05),
          max_price: Math.round(maxPrice * 1.05),
          arrival_date: date
        });
      }
    }
    
    await Price.insertMany(prices);
    
    console.log(`✅ Successfully added ${prices.length} price entries for "${commodityName}"`);
    console.log(`📅 Date range: ${prices[0].arrival_date.toDateString()} to ${prices[prices.length - 1].arrival_date.toDateString()}`);
    console.log(`💰 Price range: ₹${basePrice.min} - ₹${basePrice.max}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error adding commodity:', error);
    return false;
  }
};

const showAllCommodities = async () => {
  try {
    const allPrices = await Price.find();
    const commodities = [...new Set(allPrices.map(p => p.commodity))].sort();
    
    console.log('\n📊 ALL COMMODITIES IN DATABASE:');
    console.log('================================');
    
    for (const commodity of commodities) {
      const count = await Price.countDocuments({ commodity });
      const dates = await Price.distinct('arrival_date', { commodity });
      const userEntries = await Price.countDocuments({ commodity, userId: { $exists: true } });
      const govEntries = count - userEntries;
      
      console.log(`\n✓ ${commodity}`);
      console.log(`  Total entries: ${count}`);
      console.log(`  Unique dates: ${dates.length}`);
      console.log(`  👤 User entries: ${userEntries}`);
      console.log(`  🏛️  Gov entries: ${govEntries}`);
    }
    
    console.log('\n================================');
    console.log(`Total commodities: ${commodities.length}`);
    console.log('\n💡 All these commodities will appear in the Price Graph Analysis dropdown!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const demoAddNewCommodities = async () => {
  console.log('\n🎯 DEMO: Adding NEW Commodities');
  console.log('================================\n');
  
  // Add 3 new commodities with 14 days of history each
  await addNewCommodityWithHistory('Mango', 14);
  await addNewCommodityWithHistory('Banana', 14);
  await addNewCommodityWithHistory('Chilli', 14);
  
  console.log('\n\n🎉 DEMO COMPLETE!');
  console.log('================\n');
  
  // Show all commodities
  await showAllCommodities();
  
  console.log('\n\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. Go to: http://localhost:3000/price-graph-analysis');
  console.log('2. Open the "Select Commodity" dropdown');
  console.log('3. You will see Mango, Banana, and Chilli automatically!');
  console.log('4. Select any commodity to see its price graph');
  console.log('\n✨ When ANY user adds a new commodity, it will automatically appear!\n');
  
  process.exit(0);
};

// Command line options
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: Run demo
  demoAddNewCommodities();
} else if (args[0] === 'list') {
  // Show all commodities
  showAllCommodities().then(() => process.exit(0));
} else if (args[0] === 'add') {
  // Add specific commodity
  const commodity = args[1];
  const days = parseInt(args[2]) || 14;
  
  if (!commodity) {
    console.log('Usage: node demoAutoDetection.js add <CommodityName> [days]');
    console.log('Example: node demoAutoDetection.js add Mango 30');
    process.exit(1);
  }
  
  addNewCommodityWithHistory(commodity, days).then(() => {
    showAllCommodities().then(() => process.exit(0));
  });
} else {
  console.log('Usage:');
  console.log('  node demoAutoDetection.js           - Run demo (add Mango, Banana, Chilli)');
  console.log('  node demoAutoDetection.js list      - Show all commodities');
  console.log('  node demoAutoDetection.js add Mango 30 - Add specific commodity with history');
  process.exit(0);
}
