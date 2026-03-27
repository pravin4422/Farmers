const Price = require('../models/Price');
const genAI = require('@google/generative-ai');

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
const model = geminiApiKey ? new genAI.GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

exports.analyzePriceTrends = async (req, res) => {
  try {
    const { commodity, timeRange = 365, market, state } = req.body;

    if (!commodity) {
      return res.status(400).json({ message: 'Commodity is required' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const query = { commodity: new RegExp(commodity, 'i'), arrival_date: { $gte: startDate } };
    if (market) query.market = new RegExp(market, 'i');
    if (state) query.state = new RegExp(state, 'i');

    // Fetch from both user data and manually saved government data
    const prices = await Price.find(query).sort({ arrival_date: 1 });

    if (prices.length === 0) {
      return res.status(404).json({ message: 'No price data found for analysis' });
    }

    const oldestPrice = prices[0];
    const latestPrice = prices[prices.length - 1];
    const avgOldPrice = (oldestPrice.min_price + oldestPrice.max_price) / 2;
    const avgLatestPrice = (latestPrice.min_price + latestPrice.max_price) / 2;
    const priceDiff = avgLatestPrice - avgOldPrice;
    const percentChange = ((priceDiff / avgOldPrice) * 100).toFixed(2);

    const chartData = prices.map(p => ({
      date: p.arrival_date,
      avgPrice: (p.min_price + p.max_price) / 2,
      minPrice: p.min_price,
      maxPrice: p.max_price,
      market: p.market,
      source: p.userId ? 'User' : 'Government'
    }));

    const prompt = `Analyze this agricultural market price data:
Commodity: ${commodity}
Time Period: ${timeRange} days
Oldest Price (${oldestPrice.arrival_date.toDateString()}): ₹${avgOldPrice.toFixed(2)}
Latest Price (${latestPrice.arrival_date.toDateString()}): ₹${avgLatestPrice.toFixed(2)}
Price Change: ₹${priceDiff.toFixed(2)} (${percentChange}%)
Total Data Points: ${prices.length}
Data Sources: User entries + Government market data

Provide a brief analysis (3-4 sentences) covering:
1. Is this profitable for farmers? (profit/loss trend)
2. Market trend (rising/falling/stable)
3. Recommendation for farmers (sell now/wait/store)`;

    let aiInsight = 'AI analysis unavailable';
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        aiInsight = result.response.text();
      } catch (error) {
        console.error('AI generation error:', error);
      }
    }

    res.json({
      analysis: {
        commodity,
        timeRange: `${timeRange} days`,
        oldestPrice: { date: oldestPrice.arrival_date, price: avgOldPrice.toFixed(2) },
        latestPrice: { date: latestPrice.arrival_date, price: avgLatestPrice.toFixed(2) },
        priceDifference: priceDiff.toFixed(2),
        percentChange: `${percentChange}%`,
        trend: priceDiff > 0 ? 'Rising' : priceDiff < 0 ? 'Falling' : 'Stable',
        isProfitable: priceDiff > 0,
        dataPoints: prices.length
      },
      chartData,
      aiInsight
    });
  } catch (error) {
    res.status(500).json({ message: 'Analysis failed', error: error.message });
  }
};

exports.compareCommodities = async (req, res) => {
  try {
    const { commodities, timeRange = 365 } = req.body;

    if (!commodities || commodities.length < 2) {
      return res.status(400).json({ message: 'At least 2 commodities required for comparison' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const comparisons = await Promise.all(
      commodities.map(async (commodity) => {
        const prices = await Price.find({
          commodity: new RegExp(commodity, 'i'),
          arrival_date: { $gte: startDate }
        }).sort({ arrival_date: 1 });

        if (prices.length === 0) return null;

        const oldestPrice = prices[0];
        const latestPrice = prices[prices.length - 1];
        const avgOldPrice = (oldestPrice.min_price + oldestPrice.max_price) / 2;
        const avgLatestPrice = (latestPrice.min_price + latestPrice.max_price) / 2;
        const priceDiff = avgLatestPrice - avgOldPrice;
        const percentChange = ((priceDiff / avgOldPrice) * 100).toFixed(2);

        return {
          commodity,
          oldPrice: avgOldPrice.toFixed(2),
          currentPrice: avgLatestPrice.toFixed(2),
          change: priceDiff.toFixed(2),
          percentChange: `${percentChange}%`,
          isProfitable: priceDiff > 0
        };
      })
    );

    const validComparisons = comparisons.filter(c => c !== null);

    if (validComparisons.length === 0) {
      return res.status(404).json({ message: 'No data found for comparison' });
    }

    const prompt = `Compare these agricultural commodities based on price trends:
${validComparisons.map(c => `${c.commodity}: ${c.percentChange} change (₹${c.change})`).join('\n')}

Which commodity shows the best profit potential? Provide a brief recommendation (2-3 sentences).`;

    let aiRecommendation = 'AI recommendation unavailable';
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        aiRecommendation = result.response.text();
      } catch (error) {
        console.error('AI generation error:', error);
      }
    }

    res.json({ comparisons: validComparisons, aiRecommendation });
  } catch (error) {
    res.status(500).json({ message: 'Comparison failed', error: error.message });
  }
};
