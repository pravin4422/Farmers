const { chatWithAI } = require('../services/chatbotService');
const { generateAudio } = require('../services/audioService');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Creator = require('../models/Creator');
const CultivationActivity = require('../models/CultivationActivity');
const Product = require('../models/Product');
const Tractor = require('../models/Tractor');
const Expiry = require('../models/Expiry');
const Problem = require('../models/Problem');
const Kamitty = require('../models/Kamitty');
const SeasonReport = require('../models/SeasonReport');

// Decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const chat = async (req, res) => {
  try {
    const { message, conversationHistory, language, audioMode } = req.body;
    const userId = req.user.id || req.user._id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get user profile information
    const user = await User.findById(userId).select('name email cropExperience isAgriculturalOfficer');
    const userProfile = await UserProfile.findOne({ userId }).select('agricultureExperience age address mainCrop landSize educationQualification');
    
    // Get user's farming records (Creator Details) - fetch more for multi-year comparison
    const creatorRecords = await Creator.find({ user: userId })
      .sort({ year: -1, createdAt: -1 })
      .select('season year seedDate seedWeight seedCost seedingCount peopleCount moneyPerPerson totalSeedingCost plantingDate workers seedingTakers')
      .lean();

    // Get cultivation field records
    const cultivationRecords = await CultivationActivity.find({ userId })
      .sort({ date: -1 })
      .select('crop season year date activity workers cost notes')
      .lean();

    // Get product inventory
    const products = await Product.find({ user: userId })
      .sort({ date: -1 })
      .select('name season year date day quantity cost total')
      .lean();

    // Get tractor usage records
    const tractorRecords = await Tractor.find({ userId })
      .sort({ date: -1 })
      .select('date hours fuelUsed cost activity notes')
      .lean();

    // Get expiry/solution records
    const expiryRecords = await Expiry.find({ userId })
      .sort({ createdAt: -1 })
      .select('productName expiryDate category notes cropName season year hypotheticalSolution effectiveness')
      .lean();

    // Get problem reports
    const problemRecords = await Problem.find({ userId })
      .sort({ createdAt: -1 })
      .select('title description cropName season year status solution severity')
      .lean();

    // Get Kamitty (Mandi) records
    const kamittyRecords = await Kamitty.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('season year date description numBags costPerBag otherCost totalKamitty')
      .lean();

    // Get Season Reports (Yield & Revenue data)
    const seasonReports = await SeasonReport.find({ user: userId })
      .sort({ year: -1, createdAt: -1 })
      .select('season year productName totalYield numberOfBags totalAmount createdAt')
      .lean();

    // Create user context for AI
    let userContext = '';
    if (user) {
      userContext = `User Information (use this to personalize responses):\n`;
      userContext += `- Name: ${user.name || 'Not provided'}\n`;
      userContext += `- Crop Experience: ${user.cropExperience || 'Not provided'}\n`;
      userContext += `- Role: ${user.isAgriculturalOfficer ? 'Agricultural Officer' : 'Farmer'}\n`;
      
      if (userProfile) {
        userContext += `- Agriculture Experience: ${userProfile.agricultureExperience} years\n`;
        userContext += `- Age: ${userProfile.age} years\n`;
        userContext += `- Location: ${userProfile.address}\n`;
        userContext += `- Main Crop: ${userProfile.mainCrop}\n`;
        if (userProfile.landSize) userContext += `- Land Size: ${userProfile.landSize} acres\n`;
        if (userProfile.educationQualification) userContext += `- Education: ${userProfile.educationQualification}\n`;
      }
      
      // Add farming records with year-wise summary
      if (creatorRecords && creatorRecords.length > 0) {
        userContext += `\nFarming Records (Total: ${creatorRecords.length} entries):\n`;
        
        // Group by year for easy comparison
        const yearWiseData = {};
        creatorRecords.forEach(record => {
          const year = record.year;
          if (!yearWiseData[year]) {
            yearWiseData[year] = {
              totalSeedCost: 0,
              totalLaborCost: 0,
              totalCost: 0,
              seasons: [],
              records: []
            };
          }
          
          const seedCost = record.seedCost || 0;
          const laborCost = record.totalSeedingCost || 0;
          
          yearWiseData[year].totalSeedCost += seedCost;
          yearWiseData[year].totalLaborCost += laborCost;
          yearWiseData[year].totalCost += (seedCost + laborCost);
          yearWiseData[year].seasons.push(record.season);
          yearWiseData[year].records.push(record);
        });
        
        // Add year-wise summary
        userContext += `\nYEAR-WISE COST SUMMARY:\n`;
        Object.keys(yearWiseData).sort((a, b) => b - a).forEach(year => {
          const data = yearWiseData[year];
          userContext += `\nYear ${year}:\n`;
          userContext += `  - Total Seed Cost: ₹${data.totalSeedCost}\n`;
          userContext += `  - Total Labor Cost: ₹${data.totalLaborCost}\n`;
          userContext += `  - TOTAL COST: ₹${data.totalCost}\n`;
          userContext += `  - Seasons: ${[...new Set(data.seasons)].join(', ')}\n`;
          userContext += `  - Number of Records: ${data.records.length}\n`;
        });
        
        // Add detailed records
        userContext += `\nDETAILED RECORDS:\n`;
        creatorRecords.slice(0, 15).forEach((record, index) => {
          userContext += `\nRecord ${index + 1}:\n`;
          userContext += `  - Season: ${record.season}, Year: ${record.year}\n`;
          if (record.seedDate) userContext += `  - Seed Date: ${new Date(record.seedDate).toLocaleDateString()}\n`;
          if (record.seedWeight) userContext += `  - Seed Weight: ${record.seedWeight} kg\n`;
          if (record.seedCost) userContext += `  - Seed Cost: ₹${record.seedCost}\n`;
          if (record.seedingCount) userContext += `  - Seeding Count: ${record.seedingCount}\n`;
          if (record.peopleCount) userContext += `  - Workers: ${record.peopleCount} people\n`;
          if (record.moneyPerPerson) userContext += `  - Cost per Worker: ₹${record.moneyPerPerson}\n`;
          if (record.totalSeedingCost) userContext += `  - Total Seeding Cost: ₹${record.totalSeedingCost}\n`;
          if (record.plantingDate) userContext += `  - Planting Date: ${new Date(record.plantingDate).toLocaleDateString()}\n`;
        });
      }
      
      userContext += `\nUse this information to:\n`;
      userContext += `- Compare costs across different years\n`;
      userContext += `- Analyze spending trends and patterns\n`;
      userContext += `- Provide cost-saving recommendations\n`;
      userContext += `- Answer questions about farming history, costs, or patterns\n`;
      userContext += `- Calculate totals, averages, and comparisons when asked\n`;
      userContext += `\nIMPORTANT - PREDICTIVE ANALYSIS:\n`;
      userContext += `- PREDICT FUTURE: Based on historical data, predict which crops will be most profitable\n`;
      userContext += `- RECOMMEND BEST CROPS: Suggest crops based on:\n`;
      userContext += `  * Past cost trends (which crops cost less)\n`;
      userContext += `  * Seasonal success patterns\n`;
      userContext += `  * Cost efficiency and ROI\n`;
      userContext += `  * Location: ${userProfile?.address || 'Tamil Nadu'}\n`;
      userContext += `  * Current market prices\n`;
      userContext += `- FUTURE PLANNING: When asked "What should I plant?" or "Which crop is best?":\n`;
      userContext += `  1. Analyze past 3 years data\n`;
      userContext += `  2. Compare seed costs, labor costs, total costs\n`;
      userContext += `  3. Identify lowest-cost crops\n`;
      userContext += `  4. Predict best season to plant\n`;
      userContext += `  5. Estimate future costs based on trends\n`;
      userContext += `  6. Recommend top 3 crops with reasons\n`;
      userContext += `  7. Provide expected costs and yields\n`;
      userContext += `  8. Consider market demand and prices\n`;
      userContext += `  9. Suggest crop rotation strategies\n`;
      userContext += `  10. Give risk analysis and alternatives\n`;
      userContext += `  11. Compare production yields across years\n`;
      userContext += `  12. Analyze profit margins and ROI\n`;
      userContext += `  13. Consider weather patterns and climate\n`;
      userContext += `  14. Suggest best planting dates based on history\n`;
      userContext += `  15. Provide cost-benefit analysis\n`;
      userContext += `\nProvide data-driven predictions and recommendations based on their farming records.`;
    }

    // Add cultivation field records
    if (cultivationRecords && cultivationRecords.length > 0) {
      userContext += `\n\nCULTIVATION FIELD RECORDS (${cultivationRecords.length} activities):\n`;
      cultivationRecords.slice(0, 20).forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.activity} - ${record.crop}\n`;
        userContext += `   Date: ${new Date(record.date).toLocaleDateString()}, Season: ${record.season}, Year: ${record.year}\n`;
        if (record.workers) userContext += `   Workers: ${record.workers}\n`;
        if (record.cost) userContext += `   Cost: ₹${record.cost}\n`;
        if (record.notes) userContext += `   Notes: ${record.notes}\n`;
      });
    }

    // Add product inventory
    if (products && products.length > 0) {
      userContext += `\n\nAGROMEDICAL PRODUCTS INVENTORY (${products.length} items):\n`;
      
      // Calculate totals
      const totalCost = products.reduce((sum, p) => sum + (p.total || 0), 0);
      userContext += `Total Inventory Value: ₹${totalCost}\n\n`;
      
      products.slice(0, 20).forEach((product, index) => {
        userContext += `${index + 1}. ${product.name}\n`;
        userContext += `   Date: ${product.date}, Day: ${product.day}\n`;
        userContext += `   Season: ${product.season}, Year: ${product.year}\n`;
        userContext += `   Quantity: ${product.quantity}\n`;
        userContext += `   Cost per unit: ₹${product.cost}\n`;
        userContext += `   Total: ₹${product.total}\n\n`;
      });
    }

    // Add tractor usage
    if (tractorRecords && tractorRecords.length > 0) {
      userContext += `\n\nTRACTOR USAGE RECORDS (${tractorRecords.length} entries):\n`;
      tractorRecords.slice(0, 15).forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.activity || 'General use'}\n`;
        userContext += `   Date: ${new Date(record.date).toLocaleDateString()}\n`;
        if (record.hours) userContext += `   Hours: ${record.hours}\n`;
        if (record.fuelUsed) userContext += `   Fuel: ${record.fuelUsed} liters\n`;
        if (record.cost) userContext += `   Cost: ₹${record.cost}\n`;
      });
    }

    // Add expiry/solution records with crop-wise analysis
    if (expiryRecords && expiryRecords.length > 0) {
      userContext += `\n\nHYPOTHETICAL SOLUTIONS & PRODUCT TRACKING (${expiryRecords.length} entries):\n`;
      
      // Group by crop for analysis
      const cropWiseSolutions = {};
      
      expiryRecords.forEach((record, index) => {
        const crop = record.cropName || 'General';
        if (!cropWiseSolutions[crop]) {
          cropWiseSolutions[crop] = { total: 0, effective: 0, solutions: [] };
        }
        cropWiseSolutions[crop].total++;
        if (record.effectiveness === 'Good' || record.effectiveness === 'Excellent') {
          cropWiseSolutions[crop].effective++;
        }
        cropWiseSolutions[crop].solutions.push(record);
      });
      
      // Summary by crop
      userContext += `\nSOLUTION EFFECTIVENESS BY CROP:\n`;
      Object.keys(cropWiseSolutions).forEach(crop => {
        const data = cropWiseSolutions[crop];
        const successRate = data.total > 0 ? ((data.effective / data.total) * 100).toFixed(1) : 0;
        userContext += `\n${crop}:\n`;
        userContext += `  - Total Solutions Tried: ${data.total}\n`;
        userContext += `  - Effective Solutions: ${data.effective}\n`;
        userContext += `  - Success Rate: ${successRate}%\n`;
      });
      
      userContext += `\n\nDETAILED SOLUTION RECORDS:\n`;
      expiryRecords.forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.productName}`;
        if (record.cropName) userContext += ` (for ${record.cropName})`;
        userContext += `\n`;
        if (record.category) userContext += `   Category: ${record.category}\n`;
        if (record.expiryDate) userContext += `   Expiry Date: ${new Date(record.expiryDate).toLocaleDateString()}\n`;
        if (record.season) userContext += `   Season: ${record.season}, Year: ${record.year}\n`;
        if (record.hypotheticalSolution) userContext += `   Solution Applied: ${record.hypotheticalSolution}\n`;
        if (record.effectiveness) userContext += `   Effectiveness: ${record.effectiveness}\n`;
        if (record.notes) userContext += `   Notes: ${record.notes}\n`;
      });
    }

    // Add problem reports with crop-wise severity analysis
    if (problemRecords && problemRecords.length > 0) {
      userContext += `\n\nREPORTED PROBLEMS & ISSUES (${problemRecords.length} problems):\n`;
      
      // Group by crop and analyze
      const cropWiseProblems = {};
      const seasonYearProblems = {};
      
      problemRecords.forEach(record => {
        const crop = record.cropName || 'General';
        const seasonYear = `${record.season}-${record.year}`;
        
        // Crop-wise grouping
        if (!cropWiseProblems[crop]) {
          cropWiseProblems[crop] = {
            total: 0,
            resolved: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            problems: []
          };
        }
        cropWiseProblems[crop].total++;
        if (record.status === 'Resolved' || record.status === 'Closed') {
          cropWiseProblems[crop].resolved++;
        }
        if (record.severity === 'Critical') cropWiseProblems[crop].critical++;
        if (record.severity === 'High') cropWiseProblems[crop].high++;
        if (record.severity === 'Medium') cropWiseProblems[crop].medium++;
        if (record.severity === 'Low') cropWiseProblems[crop].low++;
        cropWiseProblems[crop].problems.push(record);
        
        // Season-Year grouping
        if (!seasonYearProblems[seasonYear]) {
          seasonYearProblems[seasonYear] = { total: 0, critical: 0, resolved: 0 };
        }
        seasonYearProblems[seasonYear].total++;
        if (record.severity === 'Critical' || record.severity === 'High') {
          seasonYearProblems[seasonYear].critical++;
        }
        if (record.status === 'Resolved' || record.status === 'Closed') {
          seasonYearProblems[seasonYear].resolved++;
        }
      });
      
      // Crop-wise problem summary
      userContext += `\nPROBLEM ANALYSIS BY CROP:\n`;
      Object.keys(cropWiseProblems).sort((a, b) => {
        return cropWiseProblems[b].total - cropWiseProblems[a].total;
      }).forEach(crop => {
        const data = cropWiseProblems[crop];
        const resolveRate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(1) : 0;
        const riskScore = (data.critical * 4 + data.high * 3 + data.medium * 2 + data.low * 1);
        
        userContext += `\n${crop}:\n`;
        userContext += `  - Total Problems: ${data.total}\n`;
        userContext += `  - Resolved: ${data.resolved} (${resolveRate}%)\n`;
        userContext += `  - Critical Issues: ${data.critical}\n`;
        userContext += `  - High Severity: ${data.high}\n`;
        userContext += `  - Medium Severity: ${data.medium}\n`;
        userContext += `  - Low Severity: ${data.low}\n`;
        userContext += `  - Risk Score: ${riskScore} ${riskScore > 10 ? '⚠️ HIGH RISK' : riskScore > 5 ? '⚡ MODERATE' : '✅ LOW RISK'}\n`;
      });
      
      // Season-Year problem trends
      userContext += `\n\nPROBLEM TRENDS BY SEASON & YEAR:\n`;
      Object.keys(seasonYearProblems).sort().reverse().forEach(seasonYear => {
        const data = seasonYearProblems[seasonYear];
        userContext += `\n${seasonYear}:\n`;
        userContext += `  - Total Problems: ${data.total}\n`;
        userContext += `  - Critical/High: ${data.critical}\n`;
        userContext += `  - Resolved: ${data.resolved}\n`;
      });
      
      userContext += `\n\nDETAILED PROBLEM RECORDS:\n`;
      problemRecords.forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.title}`;
        if (record.cropName) userContext += ` [${record.cropName}]`;
        userContext += `\n`;
        userContext += `   Description: ${record.description}\n`;
        if (record.season) userContext += `   Season: ${record.season}, Year: ${record.year}\n`;
        if (record.severity) userContext += `   Severity: ${record.severity}\n`;
        if (record.status) userContext += `   Status: ${record.status}\n`;
        if (record.solution) userContext += `   Solution: ${record.solution}\n`;
      });
    }

    // Add Kamitty (Mandi) records
    if (kamittyRecords && kamittyRecords.length > 0) {
      userContext += `\n\nKAMITTY/MANDI RECORDS (${kamittyRecords.length} entries):\n`;
      
      // Calculate total mandi costs
      const totalMandiCost = kamittyRecords.reduce((sum, record) => {
        const cost = parseFloat(record.totalKamitty) || 0;
        return sum + cost;
      }, 0);
      
      userContext += `Total Mandi Cost (All Time): ₹${totalMandiCost}\n\n`;
      
      kamittyRecords.forEach((record, index) => {
        userContext += `${index + 1}. Mandi Entry\n`;
        userContext += `   Date: ${record.date}\n`;
        if (record.season) userContext += `   Season: ${record.season}\n`;
        if (record.year) userContext += `   Year: ${record.year}\n`;
        if (record.description) userContext += `   Description: ${record.description}\n`;
        if (record.numBags) userContext += `   Number of Bags: ${record.numBags}\n`;
        if (record.costPerBag) userContext += `   Cost per Bag: ₹${record.costPerBag}\n`;
        if (record.otherCost) userContext += `   Other Costs: ₹${record.otherCost}\n`;
        if (record.totalKamitty) userContext += `   Total Mandi Cost: ₹${record.totalKamitty}\n`;
        userContext += `\n`;
      });
    }

    // Add Season Reports with profit analysis
    if (seasonReports && seasonReports.length > 0) {
      userContext += `\n\nSEASON REPORTS - YIELD & REVENUE DATA (${seasonReports.length} reports):\n`;
      
      // Calculate totals and group by year
      const yearWiseReports = {};
      let totalRevenue = 0;
      let totalBags = 0;
      
      seasonReports.forEach(report => {
        const year = report.year;
        if (!yearWiseReports[year]) {
          yearWiseReports[year] = { crops: [], totalYield: 0, totalBags: 0, totalRevenue: 0 };
        }
        yearWiseReports[year].crops.push(report);
        yearWiseReports[year].totalYield += report.totalYield || 0;
        yearWiseReports[year].totalBags += report.numberOfBags || 0;
        yearWiseReports[year].totalRevenue += report.totalAmount || 0;
        totalRevenue += report.totalAmount || 0;
        totalBags += report.numberOfBags || 0;
      });
      
      userContext += `Total Production: ${totalBags} bags\n`;
      userContext += `Total Revenue (All Time): ₹${totalRevenue}\n\n`;
      
      // Year-wise summary
      userContext += `YEAR-WISE PRODUCTION & REVENUE SUMMARY:\n`;
      Object.keys(yearWiseReports).sort((a, b) => b - a).forEach(year => {
        const data = yearWiseReports[year];
        userContext += `\nYear ${year}:\n`;
        userContext += `  - Total Yield: ${data.totalYield} kg\n`;
        userContext += `  - Total Bags: ${data.totalBags} bags\n`;
        userContext += `  - Total Revenue: ₹${data.totalRevenue}\n`;
        userContext += `  - Average per Bag: ₹${(data.totalRevenue / data.totalBags).toFixed(2)}\n`;
        userContext += `  - Crops Grown: ${data.crops.map(c => c.productName).join(', ')}\n`;
      });
      
      userContext += `\n\nDETAILED SEASON REPORTS:\n`;
      seasonReports.forEach((report, index) => {
        userContext += `\n${index + 1}. ${report.productName}\n`;
        userContext += `   Season: ${report.season}, Year: ${report.year}\n`;
        userContext += `   Total Yield: ${report.totalYield} kg\n`;
        userContext += `   Number of Bags: ${report.numberOfBags} bags\n`;
        userContext += `   Kg per Bag: ${(report.totalYield / report.numberOfBags).toFixed(2)} kg\n`;
        userContext += `   Total Revenue: ₹${report.totalAmount}\n`;
        userContext += `   Revenue per Bag: ₹${(report.totalAmount / report.numberOfBags).toFixed(2)}\n`;
        userContext += `   Revenue per Kg: ₹${(report.totalAmount / report.totalYield).toFixed(2)}\n`;
        userContext += `   Date: ${new Date(report.createdAt).toLocaleDateString()}\n`;
      });
      
      userContext += `\n\n🎯 BEST CROP RECOMMENDATION ANALYSIS:\n`;
      userContext += `Use the above data to provide intelligent crop recommendations by:\n`;
      userContext += `1. PROFIT ANALYSIS: Calculate profit = Revenue (totalAmount) - Total Costs (from Creator + Products + Kamitty)\n`;
      userContext += `2. ROI CALCULATION: Compare investment vs returns for each crop\n`;
      userContext += `3. YIELD EFFICIENCY: Analyze yield per acre, per bag, and per rupee invested\n`;
      userContext += `4. BAG ANALYSIS: Compare number of bags produced vs market demand\n`;
      userContext += `5. PRICE PER BAG: Identify crops with highest revenue per bag\n`;
      userContext += `6. SEASONAL PATTERNS: Identify which crops perform best in which seasons\n`;
      userContext += `7. TREND ANALYSIS: Compare year-over-year performance in bags and revenue\n`;
      userContext += `8. COST-BENEFIT: Match low-cost crops with high revenue per bag\n`;
      userContext += `9. RISK ASSESSMENT: Identify consistent performers vs volatile crops\n`;
      userContext += `10. MARKET TIMING: Suggest best planting/harvesting times based on past data\n`;
      userContext += `11. PROBLEM FREQUENCY: Analyze which crops had fewer problems (from Problem Reports)\n`;
      userContext += `12. PROBLEM SEVERITY: Consider crops with lower risk scores and fewer critical issues\n`;
      userContext += `13. SOLUTION SUCCESS: Factor in crops with higher solution effectiveness rates\n`;
      userContext += `14. RESOLVE RATE: Prefer crops with higher problem resolution rates\n`;
      userContext += `15. SEASONAL RISK: Identify which seasons had more problems for each crop\n`;
      userContext += `16. COMPREHENSIVE RISK SCORE: Combine financial risk + problem risk for each crop\n`;
      userContext += `\nWhen asked "Which crop should I grow?" or "Best crop recommendation":\n`;
      userContext += `- Rank crops by: (Profitability × 0.4) + (Low Problem Score × 0.3) + (Solution Success × 0.2) + (ROI × 0.1)\n`;
      userContext += `- Show top 3 crops with detailed breakdown:\n`;
      userContext += `  * Expected profit and costs\n`;
      userContext += `  * Yields (kg + bags) and revenue\n`;
      userContext += `  * Revenue per bag and per kg\n`;
      userContext += `  * Historical problem count and severity\n`;
      userContext += `  * Problem resolution rate\n`;
      userContext += `  * Solution effectiveness rate\n`;
      userContext += `  * Overall risk assessment (Financial + Operational)\n`;
      userContext += `  * Season-specific recommendations\n`;
      userContext += `  * Preventive measures based on past problems\n`;
      userContext += `- Provide data-driven predictions for next season\n`;
      userContext += `- Include risk mitigation strategies\n`;
      userContext += `- Suggest which problems to watch out for\n`;
      userContext += `- Recommend proven solutions from past experience\n`;
    }

    const result = await chatWithAI(message, conversationHistory || [], language || 'english', userContext);

    console.log('🤖 AI Result:', { success: result.success, hasResponse: !!result.response, responseLength: result.response?.length });

    if (result.success) {
      // Generate audio if audio mode is enabled
      let audioData = null;
      if (audioMode) {
        audioData = await generateAudio(result.response, language || 'english');
      }

      // Save to database
      await ChatHistory.findOneAndUpdate(
        { userId },
        {
          $push: {
            messages: [
              { role: 'user', content: message },
              { role: 'assistant', content: result.response }
            ]
          },
          language: language || 'english'
        },
        { upsert: true, new: true }
      );

      res.json({
        response: decodeHtmlEntities(result.response),
        conversationHistory: result.conversationHistory,
        audio: audioData
      });
      
      console.log('✅ Response sent to frontend:', { 
        responseLength: result.response?.length, 
        hasConversationHistory: !!result.conversationHistory,
        firstChars: result.response?.substring(0, 50)
      });
    } else {
      console.error('❌ AI result failed:', result.error);
      res.status(500).json({
        message: 'Failed to get AI response',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { limit = 50 } = req.query;

    const history = await ChatHistory.findOne({ userId })
      .select('messages language')
      .lean();

    if (!history) {
      return res.json({ messages: [], language: 'english' });
    }

    const recentMessages = history.messages.slice(-limit);

    res.json({
      messages: recentMessages,
      language: history.language
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages: [] } }
    );

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { chat, getChatHistory, clearChatHistory };
