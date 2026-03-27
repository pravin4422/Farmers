# Government Scheme AI Button Feature

## Overview
Added an AI button to each government scheme card that redirects users to the AI chatbot with a detailed, pre-filled prompt explaining the scheme comprehensively.

## Feature Description
When users click the "Ask AI" button on any government scheme:
1. A detailed prompt is automatically generated with all scheme information
2. User is redirected to the AI Chat page (/ai-chat)
3. The prompt is automatically sent to the AI chatbot
4. AI provides a comprehensive explanation with practical guidance

## Files Modified

### 1. Frontend - Scheme Component
**File**: `frontend/src/pages/Schemes/Scheme.js`

**Changes**:
- Added `useNavigate` hook from react-router-dom
- Created `askAI()` function that:
  - Generates detailed prompt with scheme information
  - Stores prompt in localStorage
  - Navigates to /ai-chat page
- Added "Ask AI" button in scheme actions section

**New Function**:
```javascript
const askAI = (scheme) => {
  const prompt = `Explain the ${scheme.name} government scheme in detail. Include:
- Launch year: ${scheme.details.launch || 'N/A'}
- Objective: ${scheme.details.objective || 'N/A'}
- Benefits: ${scheme.details.benefit || 'N/A'}
- Eligibility criteria: ${scheme.details.eligibility || 'N/A'}
- How to apply: ${scheme.details.apply || 'N/A'}
- Required documents: ${scheme.details.documents || 'N/A'}
- Application mode: ${scheme.details.applicationMode || 'N/A'}

Please provide a comprehensive explanation with practical guidance for farmers.`;
  
  localStorage.setItem('aiChatPrompt', prompt);
  navigate('/ai-chat');
};
```

### 2. Frontend - Scheme Styles
**File**: `frontend/src/css/Schemes/Scheme.css`

**Changes**:
- Added `.ai-btn` class with gradient background
- Added hover effect for AI button

**New Styles**:
```css
.ai-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-btn:hover {
  background: linear-gradient(135deg, #5568d3 0%, #653a8a 100%);
  transform: translateY(-2px);
}
```

### 3. Frontend - AI Home Component
**File**: `frontend/src/pages/AiHome.js`

**Changes**:
- Added `useEffect` hook to check for pre-filled prompt from localStorage
- Automatically opens AI chat when prompt is detected
- Clears localStorage after reading the prompt

**New Code**:
```javascript
React.useEffect(() => {
  const prompt = localStorage.getItem('aiChatPrompt');
  if (prompt) {
    setAiChatMessage(prompt);
    setShowAiChat(true);
    setCurrentView('');
    localStorage.removeItem('aiChatPrompt');
  }
}, []);
```

### 4. Frontend - AI Chat Component
**File**: `frontend/src/pages/AiChat.js`

**Changes**:
- Enhanced `useEffect` for `initialMessage` prop
- Added `handleSendInitialMessage()` function
- Automatically sends the message after 500ms delay

**New Function**:
```javascript
const handleSendInitialMessage = async (message) => {
  if (!message.trim()) return;

  const userMessage = { 
    role: 'user', 
    content: message
  };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        message: message,
        conversationHistory,
        language
      })
    });

    const data = await response.json();
    const aiMessage = { role: 'assistant', content: data.response };
    setMessages(prev => [...prev, aiMessage]);
    setConversationHistory(data.conversationHistory || []);
  } catch (error) {
    const errorMessage = { role: 'assistant', content: t.error };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setLoading(false);
  }
};
```

## User Flow

1. **User browses schemes**: User navigates to /schemes page
2. **Expand scheme details**: User clicks on a scheme to see full details
3. **Click Ask AI button**: User clicks the "🤖 Ask AI" button
4. **Redirect to AI Chat**: User is automatically redirected to /ai-chat page
5. **Auto-send prompt**: Detailed prompt is automatically sent to AI
6. **Receive explanation**: AI provides comprehensive explanation of the scheme

## Button Layout

The scheme actions section now has three buttons:
```
[🤖 Ask AI] [🔍 Search] [Website]
```

- **Ask AI**: Opens AI chat with detailed scheme explanation
- **Search**: Opens Google search for the scheme
- **Website**: Opens official scheme website (if available)

## Prompt Template

The AI receives a structured prompt with:
- Scheme name
- Launch year
- Objective
- Benefits
- Eligibility criteria
- Application process
- Required documents
- Application mode

This ensures the AI provides consistent, comprehensive explanations.

## Technical Implementation

### Data Flow
```
Scheme Page → localStorage → AI Home → AI Chat → Backend API → AI Response
```

### State Management
- Uses localStorage for cross-component communication
- Cleans up localStorage after reading to prevent duplicate sends
- Maintains conversation history in AI Chat component

### Error Handling
- Handles missing scheme details gracefully (shows 'N/A')
- Validates prompt before sending
- Shows error messages if AI request fails

## Benefits

1. **Instant Expert Guidance**: Users get AI-powered explanations immediately
2. **Comprehensive Information**: All scheme details included in prompt
3. **Practical Advice**: AI provides actionable guidance for farmers
4. **Seamless Experience**: Automatic navigation and message sending
5. **Context-Aware**: AI receives full scheme context for accurate responses

## Future Enhancements

1. Add language selection for AI responses (Tamil/English)
2. Include scheme comparison feature
3. Add follow-up question suggestions
4. Implement scheme eligibility checker
5. Add document checklist generator

## Testing Checklist

- [ ] Click Ask AI button on different schemes
- [ ] Verify redirect to /ai-chat page
- [ ] Confirm prompt is auto-sent
- [ ] Check AI response quality
- [ ] Test with schemes having missing details
- [ ] Verify localStorage cleanup
- [ ] Test on mobile devices
- [ ] Check button styling and hover effects

## Dependencies

- react-router-dom: For navigation
- localStorage API: For cross-component data passing
- Existing AI chatbot backend: For processing requests

## Notes

- Requires user to be logged in (protected route)
- Uses existing chatbot API endpoint
- No backend changes required
- Fully compatible with existing scheme data structure
