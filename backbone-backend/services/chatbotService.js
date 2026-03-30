const Groq = require('groq-sdk');

const chatWithAI = async (userMessage, conversationHistory = [], language = 'english', userContext = '') => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompts = {
      english: `You are a helpful AI assistant with farming expertise. Answer questions naturally and provide detailed explanations when asked.

⚠️ RESPOND ONLY IN ENGLISH.

For farming questions:
- Give exact amounts and steps
- Include costs (₹) when relevant
- Provide natural and chemical options
- Use clear, simple language
- When user asks for "more details", "explain more", or similar, provide comprehensive information

For general questions:
- Answer directly and clearly
- Provide more details when specifically requested
- If user asks to "explain more" or "tell me more", expand on the previous topic with additional information

${userContext ? userContext : ''}`,
      
      tamil: `நீங்கள் விவசாய நிபுணத்துவம் கொண்ட உதவிகரமான AI. கேள்விகளுக்கு இயல்பாகவும், கேட்கும்போது விரிவான விளக்கங்களையும் கொடுங்கள்.

⚠️ தமிழில் மட்டும் பதிலளிக்கவும்.

விவசாய கேள்விகளுக்கு:
- சரியான அளவு மற்றும் படிகள் கொடுங்கள்
- தொடர்புடையதாக இருந்தால் செலவு (₹) சேர்க்கவும்
- இயற்கை மற்றும் ரசாயன வழிகள் கொடுங்கள்
- தெளிவான, எளிய மொழி பயன்படுத்துங்கள்
- "மேலும் விவரங்கள்", "மேலும் விளக்கு" போன்று கேட்டால், முழுமையான தகவல் கொடுங்கள்

பொது கேள்விகளுக்கு:
- நேரடியாகவும் தெளிவாகவும் பதிலளிக்கவும்
- குறிப்பாக கேட்கும்போது மேலும் விவரங்கள் கொடுங்கள்
- "மேலும் விளக்கு" அல்லது "மேலும் சொல்" என்று கேட்டால், முந்தைய தலைப்பை விரிவாக்குங்கள்

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
      ...conversationHistory.slice(-8), // Keep last 8 messages for better context
      { role: 'user', content: finalUserMessage }
    ];

    // Try primary model first, fallback to smaller model if rate limited
    let completion;
    try {
      completion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1500, // Increased for detailed responses
        top_p: 0.9
      });
    } catch (error) {
      // If rate limited, try smaller, faster model
      if (error.status === 429) {
        console.log('⚠️ Rate limit hit, switching to llama-3.1-8b-instant...');
        completion = await groq.chat.completions.create({
          messages,
          model: 'llama-3.1-8b-instant', // Faster, uses fewer tokens
          temperature: 0.7,
          max_tokens: 1500,
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
        ...conversationHistory.slice(-8), // Keep last 8 messages for context
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
