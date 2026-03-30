const mongoose = require('mongoose');
const Price = require('./models/Price');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/backbone')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Generate historical prices for the last 30 days
const generateHistoricalPrices = () => {
  const commodities = [
    { name: 'Rice', baseMin: 2000, baseMax: 2500 },
    { name: 'Wheat', baseMin: 1800, baseMax: 2200 },
    { name: 'Tomato', baseMin: 15, baseMax: 35 },
    { name: 'Onion', baseMin: 20, baseMax: 40 },
    { name: 'Potato', baseMin: 18, baseMax: 30 }
  ];

  const markets = ['Chennai', 'Coimbatore', 'Madurai', 'Salem'];
  const state = 'Tamil Nadu';
  
  const prices = [];
  const today = new Date();
  
  commodities.forEach(commodity => {
    // Generate prices for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Add some random variation to prices (±10%)
      const variation = 1 + (Math.random() * 0.2 - 0.1);
      const trendFactor = 1 + (i / 100); // Slight upward trend
      
      const minPrice = Math.round(commodity.baseMin * variation * trendFactor);
      const maxPrice = Math.round(commodity.baseMax * variation * trendFactor);
      
      // Add government data (no userId)
      prices.push({
        commodity: commodity.name,
        market: markets[Math.floor(Math.random() * markets.length)],
        state: state,
        min_price: minPrice,
        max_price: maxPrice,
        arrival_date: date
      });
      
      // Randomly add user entries for some days (30% chance)
      if (Math.random() > 0.7) {
        const userVariation = 1 + (Math.random() * 0.15 - 0.075);
        prices.push({
          userId: new mongoose.Types.ObjectId(), // Dummy user ID
          commodity: commodity.name,
          market: markets[Math.floor(Math.random() * markets.length)],
          state: state,
          min_price: Math.round(minPrice * userVariation),
          max_price: Math.round(maxPrice * userVariation),
          arrival_date: date
        });
      }
    }
  });
  
  return prices;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting to seed historical prices...');
    
    // Optional: Clear existing prices (comment out if you want to keep existing data)
    // await Price.deleteMany({});
    // console.log('🗑️  Cleared existing prices');
    
    const historicalPrices = generateHistoricalPrices();
    
    await Price.insertMany(historicalPrices);
    
    console.log(`✅ Successfully added ${historicalPrices.length} historical price entries`);
    console.log('📊 Data includes:');
    console.log('   - 5 commodities (Rice, Wheat, Tomato, Onion, Potato)');
    console.log('   - 30 days of historical data');
    console.log('   - Mix of government and user entries');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
