const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Price = require('./models/Price');

dotenv.config();

const importGovernmentData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070', {
      params: {
        'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
        'format': 'json',
        'limit': 1000
      },
      timeout: 30000
    });

    const records = response.data.records;
    console.log(`📥 Fetched ${records.length} records from government API`);

    let imported = 0;
    for (const record of records) {
      const existingPrice = await Price.findOne({
        commodity: record.commodity,
        market: record.market,
        arrival_date: new Date(record.arrival_date),
        userId: null
      });

      if (!existingPrice) {
        await Price.create({
          commodity: record.commodity,
          market: record.market,
          state: record.state,
          min_price: parseFloat(record.min_price),
          max_price: parseFloat(record.max_price),
          arrival_date: new Date(record.arrival_date),
          userId: null
        });
        imported++;
      }
    }

    console.log(`✅ Imported ${imported} new government price records`);
    console.log(`⏭️  Skipped ${records.length - imported} duplicate records`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

importGovernmentData();
