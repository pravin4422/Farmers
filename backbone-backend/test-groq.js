const Groq = require('groq-sdk');
require('dotenv').config();

async function testGroq() {
  try {
    console.log('Testing Groq API...');
    console.log(process.env.GROQ_API_KEY);
    console.log('API Key:', process.env.GROQ_API_KEY ? 'Found' : 'Missing');
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 50
    });

    console.log('\n✅ Groq API WORKS!');
    console.log('Response:', completion.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGroq();
