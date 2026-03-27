const Groq = require('groq-sdk');

const chatWithAI = async (userMessage, conversationHistory = [], language = 'english', userContext = '') => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompts = {
      english: `You are a helpful AI assistant with farming expertise. Answer ANY question concisely.

⚠️ RESPOND ONLY IN ENGLISH.

For farming questions:
- Give exact amounts and steps
- Include costs (₹) only when relevant
- Provide natural and chemical options
- Use simple language

For general questions:
- Answer directly and concisely
- No cost analysis unless asked

${userContext ? userContext : ''}`,
      
      tamil: `நீங்கள் விவசாய நிபுணத்துவம் கொண்ட உதவிகரமான AI. எந்த கேள்விக்கும் சுருக்கமாக பதிலளிக்கவும்.

⚠️ தமிழில் மட்டும் பதிலளிக்கவும்.

விவசாய கேள்விகளுக்கு:
- சரியான அளவு மற்றும் படிகள் கொடுங்கள்
- தொடர்புடையதாக இருந்தால் மட்டும் செலவு (₹) சேர்க்கவும்
- இயற்கை மற்றும் ரசாயன வழிகள் கொடுங்கள்
- எளிய மொழி பயன்படுத்துங்கள்

பொது கேள்விகளுக்கு:
- நேரடியாகவும் சுருக்கமாகவும் பதிலளிக்கவும்
- கேட்காவிட்டால் செலவு பகுப்பாய்வு வேண்டாம்

${userContext ? userContext : ''}`
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.english;

    // Add language instruction to user message
    let finalUserMessage = userMessage;
    if (language === 'tamil') {
      finalUserMessage = `[IMPORTANT: You MUST respond in Tamil language only. தமிழில் மட்டும் பதிலளிக்கவும்.]

${userMessage}`;
    } else {
      finalUserMessage = `[IMPORTANT: You MUST respond in English language only.]

${userMessage}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4), // Only keep last 4 messages to save tokens
      { role: 'user', content: finalUserMessage }
    ];

    // Try primary model first, fallback to smaller model if rate limited
    let completion;
    try {
      completion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 800, // Reduced from 1500
        top_p: 0.9
      });
    } catch (error) {
      // If rate limited, try smaller, faster model
      if (error.status === 429) {
        console.log('⚠️ Rate limit hit, switching to llama-3.1-8b-instant...');
        completion = await groq.chat.completions.create({
          messages,
          model: 'llama-3.1-8b-instant', // Faster, uses fewer tokens
          temperature: 0.5,
          max_tokens: 800,
          top_p: 0.9
        });
      } else {
        throw error;
      }
    }

    const response = completion.choices[0]?.message?.content || 'No response generated';
    
    console.log('🤖 Groq API Response:', { 
      hasResponse: !!response, 
      responseLength: response.length,
      firstChars: response.substring(0, 100)
    });

    return {
      success: true,
      response: response,
      conversationHistory: [
        ...conversationHistory.slice(-4), // Only keep last 4 messages
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response }
      ]
    };
  } catch (error) {
    console.error('Chatbot AI error:', error.status, error.message);
    
    // Better error messages for users
    let userMessage;
    if (error.status === 429) {
      userMessage = language === 'tamil' 
        ? '🕒 AI சேவை தற்காலிகமாக கிடைக்கவில்லை. சில நிமிடங்களில் மீண்டும் முயற்சிக்கவும்.'
        : '🕒 AI service is temporarily unavailable. Please try again in a few minutes.';
    } else {
      userMessage = language === 'tamil' 
        ? 'மன்னிக்கவும், உங்கள் கோரிக்கையை இப்போது செயல்படுத்த முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
        : 'Sorry, I am unable to process your request right now. Please try again.';
    }
    
    return {
      success: false,
      response: userMessage,
      error: error.message
    };
  }
};

module.exports = { chatWithAI };
