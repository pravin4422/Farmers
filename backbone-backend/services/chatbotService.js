const Groq = require('groq-sdk');

const chatWithAI = async (userMessage, conversationHistory = [], language = 'english', userContext = '') => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompts = {
      english: `You are a helpful AI assistant with farming expertise. Answer questions naturally and provide detailed explanations when asked.

IMPORTANT: RESPOND ONLY IN ENGLISH. DO NOT USE EMOJIS IN YOUR RESPONSES. Use numbers for lists and bullet points.

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

முக்கியம்: தமிழில் மட்டும் பதிலளிக்கவும். உங்கள் பதில்களில் எமோஜிகளைப் பயன்படுத்த வேண்டாம். பட்டியல்கள் மற்றும் புள்ளிகளுக்கு எண்களைப் பயன்படுத்தவும்.

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

    let response = completion.choices[0]?.message?.content || 'No response generated';
    
    // Remove all emojis and replace with numbers
    response = response.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267E}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26A7}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
    
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
        ? 'AI சேவை தற்காலிகமாக கிடைக்கவில்லை. சில நிமிடங்களில் மீண்டும் முயற்சிக்கவும்.'
        : 'AI service is temporarily unavailable. Please try again in a few minutes.';
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
