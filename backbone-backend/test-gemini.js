const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('Testing Gemini API...');
    console.log(process.env.GEMINI_API_KEY);
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found' : 'Missing');
    
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`\nTrying ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        console.log(`✅ ${modelName} WORKS!`);
        console.log('Response:', result.response.text());
        break;
      } catch (e) {
        console.log(`❌ ${modelName} failed:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGemini();
