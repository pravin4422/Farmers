# Agricultural AI Chatbot - Setup Complete ✅

## What's Been Created:

### Backend Files:
1. `services/chatbotService.js` - Groq AI integration for agricultural advice
2. `controllers/chatbotController.js` - Request handler
3. `routes/chatbotRoutes.js` - API endpoint
4. `server.js` - Updated with chatbot routes

### Frontend Files:
1. `pages/AiChat.js` - Updated to use new chatbot API

## API Endpoint:
```
POST http://localhost:5000/api/chatbot/chat
```

### Request:
```json
{
  "message": "My tomato plants have yellow leaves",
  "conversationHistory": []  // optional, maintains context
}
```

### Response:
```json
{
  "response": "AI response text...",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

## How to Use:

### 1. Start Backend:
```bash
cd backbone-backend
node server.js
```

### 2. Start Frontend:
```bash
cd frontend
npm start
```

### 3. Access Chatbot:
Navigate to: `http://localhost:3000/ai-chat`

## Features:
✅ Agricultural expert advice
✅ Conversation history (remembers context)
✅ Specific measurements and dosages
✅ Cost-effective solutions
✅ Prevention strategies
✅ Simple farmer-friendly language
✅ Protected route (requires login)

## Example Questions:
- "My tomato plants have yellow leaves. What should I do?"
- "How to control pests in rice crops?"
- "Best fertilizer for wheat in winter season?"
- "My soil is too dry, what irrigation method should I use?"
- "How much does nitrogen fertilizer cost?"

## AI Model:
- Using: Groq API with Llama 3.3 70B
- Temperature: 0.7 (balanced creativity)
- Max tokens: 1024 (detailed responses)

## Notes:
- Requires authentication (JWT token)
- Conversation history is maintained per session
- AI is trained for Indian agricultural context
- Provides practical, actionable advice
