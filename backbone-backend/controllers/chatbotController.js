const { chatWithAI } = require('../services/chatbotService');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Creator = require('../models/Creator');
const CultivationActivity = require('../models/CultivationActivity');
const Product = require('../models/Product');
const Tractor = require('../models/Tractor');
const Expiry = require('../models/Expiry');
const Problem = require('../models/Problem');

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
    const { message, conversationHistory, language } = req.body;
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
      .select('productName expiryDate category notes season year')
      .lean();

    // Get problem reports
    const problemRecords = await Problem.find({ userId })
      .sort({ createdAt: -1 })
      .select('title description season year status solution')
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

    // Add expiry/solution records
    if (expiryRecords && expiryRecords.length > 0) {
      userContext += `\n\nHYPOTHETICAL SOLUTIONS & EXPIRY TRACKING (${expiryRecords.length} entries):\n`;
      expiryRecords.forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.productName}\n`;
        if (record.category) userContext += `   Category: ${record.category}\n`;
        if (record.expiryDate) userContext += `   Expiry Date: ${new Date(record.expiryDate).toLocaleDateString()}\n`;
        if (record.notes) userContext += `   Notes: ${record.notes}\n`;
        if (record.season) userContext += `   Season: ${record.season}\n`;
        if (record.year) userContext += `   Year: ${record.year}\n`;
      });
    }

    // Add problem reports
    if (problemRecords && problemRecords.length > 0) {
      userContext += `\n\nREPORTED PROBLEMS (${problemRecords.length} problems):\n`;
      problemRecords.forEach((record, index) => {
        userContext += `\n${index + 1}. ${record.title}\n`;
        userContext += `   Description: ${record.description}\n`;
        if (record.season) userContext += `   Season: ${record.season}\n`;
        if (record.year) userContext += `   Year: ${record.year}\n`;
        if (record.status) userContext += `   Status: ${record.status}\n`;
        if (record.solution) userContext += `   Solution: ${record.solution}\n`;
      });
    }

    const result = await chatWithAI(message, conversationHistory || [], language || 'english', userContext);

    if (result.success) {
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
        conversationHistory: result.conversationHistory
      });
    } else {
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
