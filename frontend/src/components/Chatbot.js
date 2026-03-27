import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/chatbot/chat',
        {
          message: input,
          conversationHistory
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages([...messages, userMessage, aiMessage]);
      setConversationHistory(response.data.conversationHistory);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I could not process your request.' 
      };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h2>Agricultural Assistant</h2>
      
      <div style={{ 
        height: '400px', 
        overflowY: 'auto', 
        border: '1px solid #ccc', 
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '5px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            borderRadius: '5px',
            textAlign: msg.role === 'user' ? 'right' : 'left'
          }}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          </div>
        ))}
        {loading && <div>AI is thinking...</div>}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about farming problems..."
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
          disabled={loading}
        />
        <button 
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
