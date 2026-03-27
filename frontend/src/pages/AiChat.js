import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AiChat.css';
import '../css/ai-chart.css';

const formatMessage = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
};

const AiChat = ({ initialMessage = '' }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isRecording, setIsRecording] = useState(false);
  const [showYieldForm, setShowYieldForm] = useState(false);
  const [showCropRecommendation, setShowCropRecommendation] = useState(false);
  const [cropRecommendationData, setCropRecommendationData] = useState(null);
  const [yieldFormData, setYieldFormData] = useState({
    crop: '',
    crop_year: '',
    season: '',
    state: '',
    area: '',
    annual_rainfall: ''
  });
  const [yieldOptions, setYieldOptions] = useState({ crops: [], seasons: [], states: [] });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    const storedPrompt = localStorage.getItem('aiChatPrompt');
    if (storedPrompt && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setInput(storedPrompt);
      localStorage.removeItem('aiChatPrompt');
    } else if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setInput(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (showYieldForm && yieldOptions.crops.length === 0) {
      fetch('http://127.0.0.1:5002/get_options')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setYieldOptions(data.options);
          }
        })
        .catch(err => console.error('Failed to load options:', err));
    }
  }, [showYieldForm]);

  const translations = {
    english: {
      title: 'AI Assistant',
      emptyTitle: 'How can I help you today?',
      emptySubtitle: 'Ask me anything about agriculture, farming, or any other topic.',
      placeholder: 'Type your message...',
      send: 'Send',
      error: 'Sorry, something went wrong. Please try again.'
    },
    tamil: {
      title: 'AI உதவியாளர்',
      emptyTitle: 'இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      emptySubtitle: 'விவசாயம், பண்ணை அல்லது வேறு எந்த தலைப்பிலும் என்னிடம் கேளுங்கள்.',
      placeholder: 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...',
      send: 'அனுப்பு',
      error: 'மன்னிக்கவும், ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.'
    }
  };

  const t = translations[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'tamil' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [language]);

  const [conversationHistory, setConversationHistory] = useState([]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/chatbot/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          const displayMessages = data.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          setMessages(displayMessages);
          
          const aiHistory = data.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          setConversationHistory(aiHistory);
          
          if (data.language) {
            setLanguage(data.language);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    
    loadChatHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
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
          message: messageText,
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClick = async () => {
    if (!recognitionRef.current) {
      alert(language === 'tamil' ? 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.' : 'Voice input not supported in this browser.');
      return;
    }
    
    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          alert(language === 'tamil' ? 'பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'No speech detected. Please try again.');
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      try {
        recognition.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsRecording(false);
      }
    }
  };

  const handleYieldPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userMessage = {
      role: 'user',
      content: `Yield Prediction Request:\nCrop: ${yieldFormData.crop}\nYear: ${yieldFormData.crop_year}\nSeason: ${yieldFormData.season}\nState: ${yieldFormData.state}\nArea: ${yieldFormData.area} hectares\nAnnual Rainfall: ${yieldFormData.annual_rainfall} mm`
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://127.0.0.1:5002/predict_yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(yieldFormData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const aiMessage = {
          role: 'assistant',
          content: `Predicted Yield: ${data.predicted_yield}\n\nInput Details:\n• Crop: ${data.input_details.crop}\n• Year: ${data.input_details.year}\n• Season: ${data.input_details.season}\n• State: ${data.input_details.state}\n• Area: ${data.input_details.area} hectares\n• Annual Rainfall: ${data.input_details.annual_rainfall} mm`
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Prediction failed');
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get yield prediction. Please try again.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setShowYieldForm(false);
      setYieldFormData({
        crop: '',
        crop_year: '',
        season: '',
        state: '',
        area: '',
        annual_rainfall: ''
      });
    }
  };

  const handleCropRecommendation = async () => {
    setLoading(true);
    const userMessage = {
      role: 'user',
      content: 'Recommend the best crop to plant based on my historical data'
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:5000/api/crop-recommendation/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          targetYear: new Date().getFullYear(),
          targetSeason: 'All'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to get recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setCropRecommendationData(data);
        
        let aiResponse = `🌾 CROP RECOMMENDATION ANALYSIS\n\n`;
        aiResponse += `📍 Location: ${data.userLocation}\n`;
        aiResponse += `🌾 Land Size: ${data.landSize}\n`;
        aiResponse += `📈 Records Analyzed: ${data.totalRecordsAnalyzed}\n\n`;
        
        // Warning for insufficient data
        if (data.totalRecordsAnalyzed < 5) {
          aiResponse += `⚠️ LIMITED DATA WARNING:\n`;
          aiResponse += `You have only ${data.totalRecordsAnalyzed} record(s). For better recommendations, add:\n`;
          aiResponse += `• At least 5-10 farming records\n`;
          aiResponse += `• Multiple crops/seasons\n`;
          aiResponse += `• 2-3 years of data\n`;
          aiResponse += `• Complete cost information\n`;
          aiResponse += `• Price data for your crops\n\n`;
        }
        
        aiResponse += `⭐ TOP ${data.topRecommendations.length} RECOMMENDED CROPS:\n\n`;
        
        data.topRecommendations.forEach((rec, idx) => {
          aiResponse += `${idx + 1}. ${rec.crop.toUpperCase()} (Score: ${rec.score.toFixed(1)}/100)\n`;
          aiResponse += `   💰 Avg Cost: ₹${rec.avgCost.toLocaleString()}\n`;
          if (rec.avgPrice) {
            aiResponse += `   💵 Avg Price: ₹${rec.avgPrice.toLocaleString()}\n`;
            aiResponse += `   📈 Est. Profit: ₹${rec.estimatedProfit?.toLocaleString() || 'N/A'}\n`;
          }
          aiResponse += `   🔄 Times Grown: ${rec.timesGrown}\n`;
          aiResponse += `   🎯 ${rec.recommendation}\n\n`;
        });
        
        aiResponse += `\n💡 KEY INSIGHTS:\n`;
        aiResponse += `• Most Frequent: ${data.insights.mostFrequentCrop}\n`;
        aiResponse += `• Lowest Cost: ${data.insights.lowestCostCrop}\n`;
        if (data.insights.highestPriceCrop) {
          aiResponse += `• Highest Price: ${data.insights.highestPriceCrop}\n`;
        }
        if (data.insights.bestProfitCrop) {
          aiResponse += `• Best Profit: ${data.insights.bestProfitCrop}\n`;
        }
        
        const aiMessage = {
          role: 'assistant',
          content: aiResponse
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Crop recommendation error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ ${error.message}\n\n💡 TO GET BETTER RECOMMENDATIONS:\n\n1️⃣ Add More Farming Records:\n   • Go to Creator Details\n   • Add at least 5-10 records\n   • Include different crops/seasons\n   • Add data from multiple years\n\n2️⃣ Complete Cost Information:\n   • Seed costs\n   • Labor costs (people count × cost per person)\n   • Other expenses\n\n3️⃣ Add Price Data:\n   • Go to Prices section\n   • Add market prices for your crops\n   • Update regularly\n\n4️⃣ Update Your Profile:\n   • Add your location\n   • Specify land size\n   • Set main crop\n\nOnce you have more data, the AI can provide accurate, data-driven recommendations! 🌾`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetch('http://localhost:5000/api/chatbot/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
    
    setMessages([]);
    setConversationHistory([]);
    setInput('');
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h2>{t.title}</h2>
        <div className="header-actions">
          <button
            onClick={() => navigate('/ai-home')}
            className="predictions-btn"
            title="Predictions"
          >
            🔮 Predictions
          </button>
          <button
            onClick={handleRefresh}
            className="refresh-btn"
            title={language === 'tamil' ? 'புதிய உரையாடல்' : 'New Chat'}
          >
            🔄 {language === 'tamil' ? 'புதிது' : 'New'}
          </button>
          <button
            onClick={() => setShowYieldForm(!showYieldForm)}
            className="yield-btn"
          >
            🌾 Yield Prediction
          </button>
          <button
            onClick={handleCropRecommendation}
            className="recommend-btn"
          >
            🎯 Best Crop
          </button>
          <button
            onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
            className="lang-btn"
          >
            {language === 'english' ? 'தமிழ்' : 'English'}
          </button>
        </div>
      </div>

      {showYieldForm && (
        <div className="yield-form-overlay" onClick={() => setShowYieldForm(false)}>
          <div className="yield-form-container" onClick={(e) => e.stopPropagation()}>
            <h3>🌾 Yield Prediction</h3>
            <form onSubmit={handleYieldPrediction}>
              <select
                value={yieldFormData.crop}
                onChange={(e) => setYieldFormData({...yieldFormData, crop: e.target.value})}
                required
              >
                <option value="">Select Crop</option>
                {yieldOptions.crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Year (e.g., 2000)"
                value={yieldFormData.crop_year}
                onChange={(e) => setYieldFormData({...yieldFormData, crop_year: e.target.value})}
                min="1990"
                max="2030"
                required
              />
              <select
                value={yieldFormData.season}
                onChange={(e) => setYieldFormData({...yieldFormData, season: e.target.value})}
                required
              >
                <option value="">Select Season</option>
                {yieldOptions.seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
              <select
                value={yieldFormData.state}
                onChange={(e) => setYieldFormData({...yieldFormData, state: e.target.value})}
                required
              >
                <option value="">Select State</option>
                {yieldOptions.states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Area (hectares) - e.g., 1021721.0"
                value={yieldFormData.area}
                onChange={(e) => setYieldFormData({...yieldFormData, area: e.target.value})}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Annual Rainfall (mm) - e.g., 935.6"
                value={yieldFormData.annual_rainfall}
                onChange={(e) => setYieldFormData({...yieldFormData, annual_rainfall: e.target.value})}
                required
              />
              <div className="form-actions">
                <button type="submit" disabled={loading}>Predict Yield</button>
                <button type="button" onClick={() => setShowYieldForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptySubtitle}</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t.placeholder}
          rows="1"
        />
        <button 
          className={`voice-btn ${isRecording ? 'recording' : ''}`} 
          onClick={handleVoiceClick}
          title={isRecording ? (language === 'tamil' ? 'நிறுத்து' : 'Stop') : (language === 'tamil' ? 'குரல் உள்ளீடு' : 'Voice Input')}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
        <button onClick={handleSend} disabled={!input.trim() || loading}>
          {t.send}
        </button>

      </div>
    </div>
  );
};

export default AiChat;
