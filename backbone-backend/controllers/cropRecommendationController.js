const Creator = require('../models/Creator');
const Price = require('../models/Price');
const UserProfile = require('../models/UserProfile');
const axios = require('axios');

const YIELD_ML_SERVICE_URL = 'http://127.0.0.1:5002';

exports.recommendBestCrop = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { targetYear, targetSeason } = req.body;

    console.log('Crop recommendation request from user:', userId);

    // Get user profile for location context
    const userProfile = await UserProfile.findOne({ userId }).select('address mainCrop landSize');
    
    // Get historical farming records (last 3 years)
    const creatorRecords = await Creator.find({ user: userId })
      .sort({ year: -1 })
      .limit(50)
      .lean();

    console.log('Found creator records:', creatorRecords.length);

    // Get recent price data
    const priceData = await Price.find({ userId })
      .sort({ arrival_date: -1 })
      .limit(100)
      .lean();

    console.log('Found price records:', priceData.length);

    if (!creatorRecords || creatorRecords.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No historical farming data found. Please add your farming records in Creator Details first.' 
      });
    }

    // Check if we have enough data for meaningful recommendations
    if (creatorRecords.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: `Insufficient data for accurate recommendations. You have ${creatorRecords.length} record(s), but we need at least 3-5 records with complete cost and price information for better analysis.`,
        suggestion: 'Please add more farming records with:\n• Seed costs\n• Labor costs\n• Different crops/seasons\n• Multiple years of data'
      });
    }

    // Analyze historical data by crop
    const cropAnalysis = {};
    
    creatorRecords.forEach(record => {
      const crop = record.season; // Using season as crop identifier
      if (!cropAnalysis[crop]) {
        cropAnalysis[crop] = {
          totalRecords: 0,
          totalSeedCost: 0,
          totalLaborCost: 0,
          totalCost: 0,
          avgSeedCost: 0,
          avgLaborCost: 0,
          avgTotalCost: 0,
          years: new Set(),
          seasons: []
        };
      }
      
      const seedCost = record.seedCost || 0;
      const laborCost = record.totalSeedingCost || 0;
      
      cropAnalysis[crop].totalRecords++;
      cropAnalysis[crop].totalSeedCost += seedCost;
      cropAnalysis[crop].totalLaborCost += laborCost;
      cropAnalysis[crop].totalCost += (seedCost + laborCost);
      cropAnalysis[crop].years.add(record.year);
      cropAnalysis[crop].seasons.push(record.season);
    });

    // Calculate averages
    Object.keys(cropAnalysis).forEach(crop => {
      const data = cropAnalysis[crop];
      data.avgSeedCost = data.totalSeedCost / data.totalRecords;
      data.avgLaborCost = data.totalLaborCost / data.totalRecords;
      data.avgTotalCost = data.totalCost / data.totalRecords;
      data.yearsGrown = Array.from(data.years);
    });

    // Analyze price trends
    const priceAnalysis = {};
    priceData.forEach(price => {
      const commodity = price.commodity;
      if (!priceAnalysis[commodity]) {
        priceAnalysis[commodity] = {
          avgMinPrice: 0,
          avgMaxPrice: 0,
          avgPrice: 0,
          count: 0,
          totalMin: 0,
          totalMax: 0
        };
      }
      
      priceAnalysis[commodity].totalMin += price.min_price;
      priceAnalysis[commodity].totalMax += price.max_price;
      priceAnalysis[commodity].count++;
    });

    Object.keys(priceAnalysis).forEach(commodity => {
      const data = priceAnalysis[commodity];
      data.avgMinPrice = data.totalMin / data.count;
      data.avgMaxPrice = data.totalMax / data.count;
      data.avgPrice = (data.avgMinPrice + data.avgMaxPrice) / 2;
    });

    // Calculate profitability scores
    const recommendations = [];
    
    Object.keys(cropAnalysis).forEach(crop => {
      const costData = cropAnalysis[crop];
      const priceInfo = priceAnalysis[crop] || priceAnalysis[crop.toLowerCase()] || {};
      
      // Calculate score based on:
      // 1. Low cost (40%)
      // 2. High price (40%)
      // 3. Frequency of cultivation (20%)
      
      const maxCost = Math.max(...Object.values(cropAnalysis).map(c => c.avgTotalCost));
      const costScore = maxCost > 0 ? (1 - (costData.avgTotalCost / maxCost)) * 40 : 20;
      
      const maxPrice = Math.max(...Object.values(priceAnalysis).map(p => p.avgPrice || 0));
      const priceScore = maxPrice > 0 && priceInfo.avgPrice ? (priceInfo.avgPrice / maxPrice) * 40 : 20;
      
      const frequencyScore = (costData.totalRecords / creatorRecords.length) * 20;
      
      const totalScore = costScore + priceScore + frequencyScore;
      
      recommendations.push({
        crop,
        score: totalScore,
        avgCost: Math.round(costData.avgTotalCost),
        avgSeedCost: Math.round(costData.avgSeedCost),
        avgLaborCost: Math.round(costData.avgLaborCost),
        avgPrice: priceInfo.avgPrice ? Math.round(priceInfo.avgPrice) : null,
        estimatedProfit: priceInfo.avgPrice ? Math.round(priceInfo.avgPrice - costData.avgTotalCost) : null,
        timesGrown: costData.totalRecords,
        yearsGrown: costData.yearsGrown,
        costTrend: costData.avgTotalCost < 50000 ? 'Low' : costData.avgTotalCost < 100000 ? 'Medium' : 'High',
        recommendation: totalScore > 70 ? 'Highly Recommended' : totalScore > 50 ? 'Recommended' : 'Consider Alternatives'
      });
    });

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Get top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3);

    // Create copies for insights to avoid mutating the sorted array
    const recCopy = [...recommendations];

    res.json({
      success: true,
      userLocation: userProfile?.address || 'Not specified',
      landSize: userProfile?.landSize || 'Not specified',
      analysisYear: targetYear || new Date().getFullYear(),
      analysisSeason: targetSeason || 'All seasons',
      totalRecordsAnalyzed: creatorRecords.length,
      topRecommendations,
      allRecommendations: recommendations,
      insights: {
        mostFrequentCrop: recommendations[0]?.crop,
        lowestCostCrop: recCopy.sort((a, b) => a.avgCost - b.avgCost)[0]?.crop,
        highestPriceCrop: recCopy.sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))[0]?.crop,
        bestProfitCrop: recCopy.sort((a, b) => (b.estimatedProfit || 0) - (a.estimatedProfit || 0))[0]?.crop
      }
    });

  } catch (error) {
    console.error('Crop recommendation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate recommendations', 
      details: error.message 
    });
  }
};

exports.predictFutureCrop = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { crop, targetYear, season, area, rainfall } = req.body;

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId }).select('address');
    const state = userProfile?.address || 'Tamil Nadu';

    // Call yield prediction service
    const yieldResponse = await axios.post(`${YIELD_ML_SERVICE_URL}/predict_yield`, {
      crop,
      crop_year: parseInt(targetYear),
      season,
      state,
      area: parseFloat(area),
      annual_rainfall: parseFloat(rainfall)
    });

    // Get historical cost data for this crop
    const historicalData = await Creator.find({ 
      user: userId,
      season: crop 
    }).sort({ year: -1 }).limit(5).lean();

    let avgCost = 0;
    if (historicalData.length > 0) {
      const totalCost = historicalData.reduce((sum, record) => {
        return sum + (record.seedCost || 0) + (record.totalSeedingCost || 0);
      }, 0);
      avgCost = totalCost / historicalData.length;
    }

    // Get recent price data
    const priceData = await Price.findOne({ 
      userId,
      commodity: { $regex: new RegExp(crop, 'i') }
    }).sort({ arrival_date: -1 });

    const estimatedPrice = priceData ? (priceData.min_price + priceData.max_price) / 2 : null;
    const estimatedRevenue = yieldResponse.data.predicted_yield && estimatedPrice 
      ? parseFloat(yieldResponse.data.predicted_yield) * estimatedPrice 
      : null;
    const estimatedProfit = estimatedRevenue && avgCost ? estimatedRevenue - avgCost : null;

    res.json({
      success: true,
      crop,
      targetYear,
      season,
      predictedYield: yieldResponse.data.predicted_yield,
      estimatedCost: Math.round(avgCost),
      estimatedPrice: estimatedPrice ? Math.round(estimatedPrice) : null,
      estimatedRevenue: estimatedRevenue ? Math.round(estimatedRevenue) : null,
      estimatedProfit: estimatedProfit ? Math.round(estimatedProfit) : null,
      profitMargin: estimatedRevenue && avgCost ? `${Math.round((estimatedProfit / estimatedRevenue) * 100)}%` : null,
      recommendation: estimatedProfit > 0 ? 'Profitable' : 'Not Recommended',
      historicalRecords: historicalData.length
    });

  } catch (error) {
    console.error('Future crop prediction error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to predict future crop', 
      details: error.message 
    });
  }
};
