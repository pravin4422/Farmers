const Price = require('../models/Price');
const axios = require('axios');

// Auto-save government prices to database (30-day rolling window)
const autoSaveGovernmentPrices = async () => {
  try {
    console.log('🔄 Auto-saving government prices...');
    
    // Fetch from government API
    const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070', {
      params: {
        'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
        format: 'json',
        limit: 1000
      }
    });

    if (!response.data || !response.data.records) {
      console.log('❌ No data from government API');
      return;
    }

    const records = response.data.records;
    console.log(`📊 Fetched ${records.length} records from government API`);

    // Filter valid records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let savedCount = 0;
    let skippedCount = 0;

    for (const record of records) {
      try {
        // Parse date (format: DD/MM/YYYY)
        if (!record.arrival_date || !record.arrival_date.includes('/')) {
          skippedCount++;
          continue;
        }

        const [day, month, year] = record.arrival_date.split('/');
        const arrivalDate = new Date(`${year}-${month}-${day}`);

        // Skip if date is invalid or older than 30 days
        if (isNaN(arrivalDate.getTime()) || arrivalDate < thirtyDaysAgo) {
          skippedCount++;
          continue;
        }

        // Check if this exact entry already exists
        const existingEntry = await Price.findOne({
          commodity: record.commodity,
          market: record.market,
          state: record.state,
          arrival_date: arrivalDate,
          userId: null // Government data has no userId
        });

        if (existingEntry) {
          skippedCount++;
          continue;
        }

        // Save to database
        await Price.create({
          userId: null, // No user - this is government data
          commodity: record.commodity,
          market: record.market,
          state: record.state,
          min_price: parseFloat(record.min_price) / 100, // Convert from paise to rupees
          max_price: parseFloat(record.max_price) / 100,
          arrival_date: arrivalDate
        });

        savedCount++;
      } catch (err) {
        console.error('Error saving record:', err.message);
      }
    }

    console.log(`✅ Auto-save complete: ${savedCount} new records saved, ${skippedCount} duplicates/old records skipped`);

    if (savedCount === 0 && skippedCount > 0) {
      console.log('ℹ️ All records already exist in database - no new data to save');
    }

    // Clean up old data (older than 30 days)
    await cleanupOldPrices();

  } catch (error) {
    console.error('❌ Error in auto-save:', error.message);
  }
};

// Delete prices older than 30 days (only government data, keep user data)
const cleanupOldPrices = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Price.deleteMany({
      arrival_date: { $lt: thirtyDaysAgo },
      userId: null // Only delete government data, keep user's manual entries
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${result.deletedCount} old government price records (older than 30 days)`);
    } else {
      console.log('ℹ️ No old records to clean up');
    }
  } catch (error) {
    console.error('❌ Error cleaning up old prices:', error.message);
  }
};

// Schedule auto-save to run daily at midnight
const startPriceAutoSaveScheduler = () => {
  // Run immediately on startup
  autoSaveGovernmentPrices();

  // Then run every 24 hours
  setInterval(() => {
    autoSaveGovernmentPrices();
  }, 24 * 60 * 60 * 1000); // 24 hours

  console.log('✅ Price auto-save scheduler started (runs daily)');
};

module.exports = {
  autoSaveGovernmentPrices,
  cleanupOldPrices,
  startPriceAutoSaveScheduler
};
