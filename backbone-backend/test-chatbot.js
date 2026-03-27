const axios = require('axios');

// Test the chatbot endpoint
const testChatbot = async () => {
  try {
    // First, login to get token (replace with your credentials)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'your-email@example.com',
      password: 'your-password'
    });

    const token = loginResponse.data.token;

    // Test 1: Simple question
    console.log('\n=== Test 1: Simple Question ===');
    const response1 = await axios.post(
      'http://localhost:5000/api/chatbot/chat',
      {
        message: 'My tomato plants have yellow leaves. What should I do?'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('AI Response:', response1.data.response);

    // Test 2: Follow-up question with conversation history
    console.log('\n=== Test 2: Follow-up Question ===');
    const response2 = await axios.post(
      'http://localhost:5000/api/chatbot/chat',
      {
        message: 'How much will this treatment cost?',
        conversationHistory: response1.data.conversationHistory
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('AI Response:', response2.data.response);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testChatbot();
