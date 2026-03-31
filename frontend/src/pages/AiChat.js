import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AiChat.css';
import '../css/ai-chart.css';

// Load Puter.js for TTS - DISABLED DUE TO FUNDING
// if (typeof window !== 'undefined' && !window.puter) {
//   const script = document.createElement('script');
//   script.src = 'https://js.puter.com/v2/';
//   script.async = true;
//   script.onload = () => {
//     console.log('✅ Puter.js loaded successfully');
//     console.log('✅ Puter TTS available:', !!(window.puter?.ai?.txt2speech));
//   };
//   script.onerror = () => {
//     console.error('❌ Failed to load Puter.js');
//   };
//   document.head.appendChild(script);
// }

const formatMessage = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\n/g, '\n')
    .trim();
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
  const [cropRecommendationForm, setCropRecommendationForm] = useState({
    season: '',
    product: ''
  });
  const [cropRecommendationData, setCropRecommendationData] = useState(null);
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [fromSchemePageScheme, setFromSchemePageScheme] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState(null);
  const [isPlayingSelected, setIsPlayingSelected] = useState(false);
  const currentAudioRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
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
    const storedScheme = localStorage.getItem('selectedSchemeForAI');
    
    if (storedPrompt && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      localStorage.removeItem('aiChatPrompt');
      
      // If there's a stored scheme, save it and open the modal automatically
      if (storedScheme) {
        try {
          const schemeData = JSON.parse(storedScheme);
          setFromSchemePageScheme(schemeData);
          setSelectedScheme(schemeData);
          setShowSchemeModal(true);
          localStorage.removeItem('selectedSchemeForAI');
        } catch (e) {
          console.error('Error parsing stored scheme:', e);
        }
      }
    } else if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setInput(initialMessage);
    }
    fetchSchemes();
  }, [initialMessage]);

  const fetchSchemes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/schemes/all');
      if (response.ok) {
        const data = await response.json();
        setSchemes(data);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  };

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

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check if selection is within an assistant message
        let node = selection.anchorNode;
        let isInAssistantMessage = false;
        
        while (node && node !== document.body) {
          if (node.classList) {
            if (node.classList.contains('message') && node.classList.contains('assistant')) {
              isInAssistantMessage = true;
              break;
            }
          }
          node = node.parentNode;
        }
        
        if (isInAssistantMessage) {
          setSelectedText(text);
          setSelectionPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX + (rect.width / 2)
          });
          return;
        }
      }
      
      setSelectedText('');
      setSelectionPosition(null);
    };

    document.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    };
    
    // Load voices
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  // Load chat history when component mounts or when navigating back
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
    
    // Reload chat history when window regains focus (user navigates back)
    const handleFocus = () => {
      loadChatHistory();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    console.log('🚀 Sending message:', input);
    const userMessage = { 
      role: 'user', 
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    try {
      console.log('📡 Calling chatbot API...');
      const response = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory,
          language,
          audioMode: false // Never auto-generate audio from backend
        })
      });

      const data = await response.json();
      console.log('✅ Received response:', data);
      console.log('📝 Response text:', data.response);
      
      const aiMessage = { 
        role: 'assistant', 
        content: data.response || 'No response received'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(data.conversationHistory || []);
      
      // DO NOT auto-play audio - user must click play button
      console.log('💬 Text response displayed, audio available on demand');
    } catch (error) {
      console.error('❌ Error in handleSend:', error);
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

  const handleCropRecommendation = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const userMessage = {
      role: 'user',
      content: `Recommend the best crop to plant for ${cropRecommendationForm.season} season and ${cropRecommendationForm.product} product based on my historical data, comparing expenditure vs price, yield, and problems reported`
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const token = localStorage.getItem('token');
      
      // Fetch cultivation records
      const cultivationResponse = await fetch('http://localhost:5000/api/crop-recommendation/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetYear: new Date().getFullYear(),
          targetSeason: cropRecommendationForm.season,
          targetProduct: cropRecommendationForm.product
        })
      });

      if (!cultivationResponse.ok) {
        const errorData = await cultivationResponse.json();
        throw new Error(errorData.error || errorData.details || 'Failed to get recommendations');
      }

      const data = await cultivationResponse.json();
      
      if (data.success) {
        setCropRecommendationData(data);
        
        let aiResponse = `🌾 CROP RECOMMENDATION ANALYSIS\n\n`;
        aiResponse += `📍 Location: ${data.userLocation}\n`;
        aiResponse += `🌾 Land Size: ${data.landSize}\n`;
        aiResponse += `📈 Records Analyzed: ${data.totalRecordsAnalyzed}\n`;
        aiResponse += `🗓️ Season: ${cropRecommendationForm.season}\n`;
        aiResponse += `🌱 Product: ${cropRecommendationForm.product}\n\n`;
        
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
          aiResponse += `${idx + 1}. ${rec.crop.toUpperCase()} (Score: ${rec.score.toFixed(1)}/100)\n\n`;
          
          // Financial Analysis
          aiResponse += `   💰 Financial Analysis:\n`;
          aiResponse += `      • Total Expenditure: ₹${rec.avgCost?.toLocaleString() || 'N/A'} (avg)\n`;
          if (rec.avgPrice) {
            aiResponse += `      • Total Selling Price: ₹${rec.avgPrice.toLocaleString()} (avg)\n`;
            aiResponse += `      • Net Profit: ₹${rec.estimatedProfit?.toLocaleString() || 'N/A'}`;
            if (rec.profitMargin) {
              aiResponse += ` (${rec.profitMargin.toFixed(1)}% margin)`;
            }
            aiResponse += `\n`;
          }
          aiResponse += `\n`;
          
          // Yield Performance
          if (rec.avgYield || rec.totalProduction) {
            aiResponse += `   📊 Yield Performance:\n`;
            if (rec.avgYield) {
              aiResponse += `      • Average Yield: ${rec.avgYield.toLocaleString()} kg/hectare\n`;
            }
            if (rec.totalProduction) {
              aiResponse += `      • Total Production: ${rec.totalProduction.toLocaleString()} kg\n`;
            }
            if (rec.yieldEfficiency) {
              aiResponse += `      • Yield Efficiency: ${rec.yieldEfficiency}\n`;
            }
            aiResponse += `\n`;
          }
          
          // Problem Analysis
          if (rec.problemCount !== undefined) {
            aiResponse += `   ⚠️ Problem Analysis:\n`;
            aiResponse += `      • Total Problems Reported: ${rec.problemCount}\n`;
            if (rec.problemTypes && rec.problemTypes.length > 0) {
              aiResponse += `      • Problem Types: ${rec.problemTypes.join(', ')}\n`;
            }
            if (rec.successRate !== undefined) {
              aiResponse += `      • Success Rate: ${rec.successRate.toFixed(1)}% (${rec.successfulAttempts} out of ${rec.timesGrown} times)\n`;
            }
            aiResponse += `\n`;
          }
          
          aiResponse += `   🔄 Times Grown: ${rec.timesGrown}\n`;
          aiResponse += `   🎯 ${rec.recommendation}\n\n`;
          aiResponse += `---\n\n`;
        });
        
        // Comparative Analysis Table
        if (data.topRecommendations.length > 1) {
          aiResponse += `📊 COMPARATIVE ANALYSIS:\n\n`;
          aiResponse += `Metric          `;
          data.topRecommendations.forEach(rec => {
            aiResponse += `| ${rec.crop.padEnd(10)} `;
          });
          aiResponse += `\n`;
          aiResponse += `----------------|`;
          data.topRecommendations.forEach(() => {
            aiResponse += `------------|`;
          });
          aiResponse += `\n`;
          
          // Profit Margin Row
          if (data.topRecommendations[0].profitMargin !== undefined) {
            aiResponse += `Profit Margin   `;
            data.topRecommendations.forEach(rec => {
              const value = rec.profitMargin ? `${rec.profitMargin.toFixed(1)}%` : 'N/A';
              aiResponse += `| ${value.padEnd(10)} `;
            });
            aiResponse += `\n`;
          }
          
          // Yield Row
          if (data.topRecommendations[0].avgYield !== undefined) {
            aiResponse += `Yield/Hectare   `;
            data.topRecommendations.forEach(rec => {
              const value = rec.avgYield ? `${rec.avgYield}kg` : 'N/A';
              aiResponse += `| ${value.padEnd(10)} `;
            });
            aiResponse += `\n`;
          }
          
          // Problems Row
          if (data.topRecommendations[0].problemCount !== undefined) {
            aiResponse += `Problems        `;
            data.topRecommendations.forEach(rec => {
              const value = rec.problemCount !== undefined ? rec.problemCount.toString() : 'N/A';
              aiResponse += `| ${value.padEnd(10)} `;
            });
            aiResponse += `\n`;
          }
          
          // Success Rate Row
          if (data.topRecommendations[0].successRate !== undefined) {
            aiResponse += `Success Rate    `;
            data.topRecommendations.forEach(rec => {
              const value = rec.successRate !== undefined ? `${rec.successRate.toFixed(1)}%` : 'N/A';
              aiResponse += `| ${value.padEnd(10)} `;
            });
            aiResponse += `\n`;
          }
          
          // Final Score Row
          aiResponse += `Final Score     `;
          data.topRecommendations.forEach(rec => {
            const value = `${rec.score.toFixed(1)}`;
            aiResponse += `| ${value.padEnd(10)} `;
          });
          aiResponse += `\n\n`;
          
          // Winner Declaration
          const winner = data.topRecommendations[0];
          aiResponse += `🏆 WINNER: ${winner.crop.toUpperCase()}\n`;
          if (winner.profitMargin && winner.profitMargin === Math.max(...data.topRecommendations.map(r => r.profitMargin || 0))) {
            aiResponse += `   ✅ Highest profit margin\n`;
          }
          if (winner.avgYield && winner.avgYield === Math.max(...data.topRecommendations.map(r => r.avgYield || 0))) {
            aiResponse += `   ✅ Best yield per hectare\n`;
          }
          if (winner.successRate && winner.successRate === Math.max(...data.topRecommendations.map(r => r.successRate || 0))) {
            aiResponse += `   ✅ Highest success rate\n`;
          }
          if (winner.problemCount !== undefined && winner.problemCount === Math.min(...data.topRecommendations.map(r => r.problemCount !== undefined ? r.problemCount : Infinity))) {
            aiResponse += `   ✅ Fewest problems reported\n`;
          }
        }
        
        aiResponse += `\n💡 KEY INSIGHTS:\n`;
        aiResponse += `• Most Frequent: ${data.insights.mostFrequentCrop}\n`;
        aiResponse += `• Lowest Cost: ${data.insights.lowestCostCrop}\n`;
        if (data.insights.highestPriceCrop) {
          aiResponse += `• Highest Price: ${data.insights.highestPriceCrop}\n`;
        }
        if (data.insights.bestProfitCrop) {
          aiResponse += `• Best Profit: ${data.insights.bestProfitCrop}\n`;
        }
        if (data.insights.leastProblemsCrop) {
          aiResponse += `• Least Problems: ${data.insights.leastProblemsCrop}\n`;
        }
        if (data.insights.bestYieldCrop) {
          aiResponse += `• Best Yield: ${data.insights.bestYieldCrop}\n`;
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
        content: `❌ ${error.message}\n\n💡 TO GET BETTER RECOMMENDATIONS:\n\n1️⃣ Add More Farming Records:\n   • Go to Creator Details\n   • Add at least 5-10 records\n   • Include different crops/seasons\n   • Add data from multiple years\n   • Include yield data (production quantity)\n\n2️⃣ Complete Cost Information:\n   • Seed costs\n   • Labor costs (people count × cost per person)\n   • Other expenses\n\n3️⃣ Add Price Data:\n   • Go to Prices section\n   • Add market prices for your crops\n   • Update regularly\n\n4️⃣ Report Problems/Issues:\n   • Use Review section to report any problems\n   • This helps AI understand crop risks\n   • Include disease, pest, or weather issues\n\n5️⃣ Update Your Profile:\n   • Add your location\n   • Specify land size\n   • Set main crop\n\nOnce you have more data, the AI can provide accurate, data-driven recommendations! 🌾`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setShowCropRecommendation(false);
      setCropRecommendationForm({ season: '', product: '' });
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

  const handleSchemeQuestion = async (question) => {
    const schemeToUse = selectedScheme || fromSchemePageScheme;
    if (!schemeToUse) return;
    
    console.log('📋 Scheme question clicked:', question);
    
    // Set the question in the input box first
    setInput(question);
    
    // Small delay to show the question in input, then send
    setTimeout(async () => {
      setLoading(true);
      const userMessage = { role: 'user', content: question };
      setMessages(prev => [...prev, userMessage]);
      setInput(''); // Clear input after sending

      // Queue the question audio first for scheme questions
      console.log('🎤 Queueing question audio:', question);
      queueAudioResponse(question);

      try {
        const prompt = `${question}\n\nScheme: ${schemeToUse.name}\nObjective: ${schemeToUse.details.objective}\nBenefits: ${schemeToUse.details.benefit}\nEligibility: ${schemeToUse.details.eligibility}\nHow to Apply: ${schemeToUse.details.apply}\nDocuments: ${schemeToUse.details.documents}\nWebsite: ${schemeToUse.details.website}`;

        console.log('📡 Calling chatbot API for scheme...');
        const response = await fetch('http://localhost:5000/api/chatbot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            message: prompt,
            conversationHistory,
            language
          })
        });

        const data = await response.json();
        console.log('✅ Received scheme response:', data);
        
        const aiMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, aiMessage]);
        setConversationHistory(data.conversationHistory || []);

        // Queue the full explanation audio after the question for scheme questions
        console.log('🎧 Queueing answer audio');
        queueAudioResponse(data.response);
      } catch (error) {
        console.error('❌ Error in handleSchemeQuestion:', error);
        const errorMessage = { role: 'assistant', content: t.error };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const stopAudio = () => {
    console.log('🛑 Stopping all audio, clearing queue');
    // Clear audio queue
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    if (currentAudioRef.current) {
      console.log('⏹️ Pausing current audio');
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsGeneratingAudio(false);
    setPlayingMessageIndex(null);
    setIsPlayingSelected(false);
    console.log('✅ All audio stopped');
  };

  const playAudioResponse = async (text, skipQueue = false, messageIndex = null, isSelected = false) => {
    console.log('🎵 playAudioResponse called with text length:', text?.length, 'skipQueue:', skipQueue);
    
    // If not skipping queue, add to queue and process
    if (!skipQueue && audioQueueRef.current.length > 0) {
      console.log('📝 Adding to queue, current queue length:', audioQueueRef.current.length);
      audioQueueRef.current.push(text);
      if (!isProcessingQueueRef.current) {
        processAudioQueue();
      }
      return;
    }

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      console.log('⏹️ Stopping current audio');
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsGeneratingAudio(true);
    setIsPlayingAudio(false);
    setPlayingMessageIndex(messageIndex);
    setIsPlayingSelected(isSelected);
    
    try {
      // Use browser TTS directly
      console.log('⚠️ Using browser TTS');
      setIsGeneratingAudio(false);
      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (language === 'tamil') {
          utterance.lang = 'ta-IN';
          const tamilVoice = voices.find(v => v.lang.includes('ta'));
          if (tamilVoice) {
            utterance.voice = tamilVoice;
            console.log('🎤 Using Tamil voice:', tamilVoice.name);
          }
        } else {
          utterance.lang = 'en-US';
          const englishVoice = voices.find(v => v.lang.includes('en'));
          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('🎤 Using English voice:', englishVoice.name);
          }
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          console.log('▶️ Browser TTS started');
          setIsPlayingAudio(true);
        };
        utterance.onend = () => {
          console.log('✅ Browser TTS ended');
          setIsPlayingAudio(false);
          setPlayingMessageIndex(null);
          setIsPlayingSelected(false);
          // Process next in queue if any
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          }
        };
        utterance.onerror = (error) => {
          console.error('❌ Browser TTS error:', error);
          setIsPlayingAudio(false);
          setPlayingMessageIndex(null);
          setIsPlayingSelected(false);
          // Process next in queue if any
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          }
        };
        
        window.speechSynthesis.speak(utterance);
      }, 150);
    } catch (error) {
      console.error('❌ TTS error:', error);
      setIsPlayingAudio(false);
      setIsGeneratingAudio(false);
      setPlayingMessageIndex(null);
      setIsPlayingSelected(false);
      currentAudioRef.current = null;
      // Process next in queue if any
      if (audioQueueRef.current.length > 0) {
        processAudioQueue();
      }
    }
  };

  const processAudioQueue = async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) {
      console.log('⏸️ Queue processing skipped - processing:', isProcessingQueueRef.current, 'queue length:', audioQueueRef.current.length);
      return;
    }
    
    console.log('🔄 Processing audio queue, items:', audioQueueRef.current.length);
    isProcessingQueueRef.current = true;
    const nextText = audioQueueRef.current.shift();
    console.log('▶️ Playing next audio from queue, text length:', nextText?.length);
    await playAudioResponse(nextText, true);
    isProcessingQueueRef.current = false;
  };

  const queueAudioResponse = (text) => {
    console.log('➕ Adding to audio queue, text length:', text?.length);
    audioQueueRef.current.push(text);
    console.log('📊 Queue status - length:', audioQueueRef.current.length, 'processing:', isProcessingQueueRef.current, 'playing:', isPlayingAudio, 'generating:', isGeneratingAudio);
    if (!isProcessingQueueRef.current && !isPlayingAudio && !isGeneratingAudio) {
      console.log('▶️ Starting queue processing immediately');
      processAudioQueue();
    } else {
      console.log('⏳ Queue will process after current audio finishes');
    }
  };

  const toggleAutoPlayAudio = () => {
    const newMode = !audioMode;
    console.log('🔊 Audio mode toggled:', newMode ? 'ON' : 'OFF');
    setAudioMode(newMode);
    if (newMode) {
      stopAudio();
    } else {
      // Test audio when enabling
      const testText = language === 'tamil' ? 
        'ஆடியோ பயன்முறை இயக்கப்பட்டது' : 
        'Audio mode enabled';
      console.log('🎤 Testing audio with:', testText);
      setTimeout(() => playAudioResponse(testText), 500);
    }
  };

  return (
    <div className="ai-chat-container">
      {/* Debug Panel */}
      {showDebug && (
        <div className="debug-panel">
          <h4>🐛 Debug Info</h4>
          <div className="debug-item">
            <strong>Puter.js Loaded:</strong> {window.puter ? '✅ Yes' : '❌ No'}
          </div>
          <div className="debug-item">
            <strong>Puter TTS Available:</strong> {window.puter?.ai?.txt2speech ? '✅ Yes' : '❌ No'}
          </div>
          <div className="debug-item">
            <strong>Audio Mode:</strong> {audioMode ? '🔊 ON' : '🔇 OFF'}
          </div>
          <div className="debug-item">
            <strong>Is Generating:</strong> {isGeneratingAudio ? '⏳ Yes' : '✅ No'}
          </div>
          <div className="debug-item">
            <strong>Is Playing:</strong> {isPlayingAudio ? '▶️ Yes' : '⏸️ No'}
          </div>
          <div className="debug-item">
            <strong>Queue Length:</strong> {audioQueueRef.current.length}
          </div>
          <div className="debug-item">
            <strong>Processing Queue:</strong> {isProcessingQueueRef.current ? '🔄 Yes' : '⏸️ No'}
          </div>
          <div className="debug-item">
            <strong>Language:</strong> {language}
          </div>
          <button onClick={() => setShowDebug(false)} className="close-debug-btn">Close</button>
        </div>
      )}
      
      <div className="chat-header">
        <h2>{t.title}</h2>
        <div className="header-actions">

          <button
            onClick={() => navigate('/ai-home')}
            className="predictions-btn"
            title="Predictions"
          >
            Predictions
          </button>
          <button
            onClick={handleRefresh}
            className="refresh-btn"
            title={language === 'tamil' ? 'புதிய உரையாடல்' : 'New Chat'}
          >
            {language === 'tamil' ? 'புதிது' : 'New'}
          </button>

          <button
            onClick={() => setShowCropRecommendation(true)}
            className="recommend-btn"
          >
            Best Crop
          </button>
          <button
            onClick={() => {
              if (fromSchemePageScheme) {
                setSelectedScheme(fromSchemePageScheme);
              }
              setShowSchemeModal(true);
            }}
            className="scheme-btn"
          >
            Schemes
          </button>
          <button
            onClick={toggleAutoPlayAudio}
            className={`audio-toggle-btn ${audioMode ? 'active' : ''}`}
            title={audioMode ? (language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Disable Audio Mode') : (language === 'tamil' ? 'ஆடியோவை இயக்கு' : 'Enable Audio Mode')}
            style={{ display: 'none' }}
          >
            {language === 'tamil' ? (audioMode ? 'ஆடியோ ஆன்' : 'ஆடியோ ஆஃப்') : (audioMode ? 'Audio ON' : 'Audio OFF')}
          </button>
          <button
            onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
            className="lang-btn"
          >
            {language === 'english' ? 'தமிழ்' : 'English'}
          </button>
        </div>
      </div>

      {showCropRecommendation && (
        <div className="yield-form-overlay" onClick={() => setShowCropRecommendation(false)}>
          <div className="yield-form-container" onClick={(e) => e.stopPropagation()}>
            <h3>Best Crop Recommendation</h3>
            <form onSubmit={handleCropRecommendation}>
              <select
                value={cropRecommendationForm.season}
                onChange={(e) => setCropRecommendationForm({...cropRecommendationForm, season: e.target.value})}
                required
              >
                <option value="">Select Season</option>
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="Autumn">Autumn</option>
                <option value="All">All Seasons</option>
              </select>
              <input
                type="text"
                placeholder="Agricultural Product (e.g., Rice, Wheat, Cotton)"
                value={cropRecommendationForm.product}
                onChange={(e) => setCropRecommendationForm({...cropRecommendationForm, product: e.target.value})}
                required
              />
              <div className="form-actions">
                <button type="submit" disabled={loading}>Get Recommendation</button>
                <button type="button" onClick={() => setShowCropRecommendation(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showYieldForm && (
        <div className="yield-form-overlay" onClick={() => setShowYieldForm(false)}>
          <div className="yield-form-container" onClick={(e) => e.stopPropagation()}>
            <h3>Yield Prediction</h3>
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
            {msg.role === 'assistant' && (
              <button 
                className="play-message-btn"
                onClick={() => playAudioResponse(msg.content, false, index, false)}
                disabled={(isPlayingAudio && playingMessageIndex === index && !isPlayingSelected) || isGeneratingAudio}
                title={isGeneratingAudio ? (language === 'tamil' ? 'ஆடியோ உருவாக்கப்படுகிறது...' : 'Generating audio...') : (language === 'tamil' ? 'இந்த செய்தியை கேட்க' : 'Play this message')}
              >
                {(playingMessageIndex === index && !isPlayingSelected) ? (
                  isGeneratingAudio ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" opacity="0.3"/>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.6"/>
                    </svg>
                  ) : (
                    isPlayingAudio ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )
                  )
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}

        {/* Selected Text Audio Button */}
        {selectedText && selectionPosition && (
          <button
            className="play-selected-btn"
            style={{
              position: 'absolute',
              top: `${selectionPosition.top}px`,
              left: `${selectionPosition.left}px`,
              transform: 'translateX(-50%)'
            }}
            onClick={() => {
              playAudioResponse(selectedText, false, null, true);
            }}
            disabled={(isPlayingAudio && isPlayingSelected) || isGeneratingAudio}
            title={language === 'tamil' ? 'தேர்ந்தெடுத்ததை கேட்க' : 'Play selected text'}
          >
            {isPlayingSelected ? (
              isGeneratingAudio ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.3"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.6"/>
                </svg>
              ) : (
                isPlayingAudio ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )
              )
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        )}

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
          {isRecording ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
        {(isPlayingAudio || isGeneratingAudio) ? (
          <button onClick={stopAudio} className="stop-audio-btn-input" title={language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Stop Audio'}>
            {isGeneratingAudio ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="rotating-icon">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h12v12H6z"/>
              </svg>
            )}
          </button>
        ) : null}
        <button onClick={handleSend} disabled={!input.trim() || loading}>
          {t.send}
        </button>
      </div>

      {/* Scheme Modal */}
      {showSchemeModal && (
        <div className="yield-form-overlay" onClick={() => { setShowSchemeModal(false); stopAudio(); }}>
          <div className="scheme-modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>{language === 'tamil' ? 'அரசு திட்டங்கள்' : 'Government Schemes'}</h3>
            
            {!selectedScheme && !fromSchemePageScheme ? (
              <div className="scheme-list">
                {schemes.map(scheme => (
                  <div 
                    key={scheme._id} 
                    className="scheme-item"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <h4>{scheme.name}</h4>
                    <p>{scheme.category}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="scheme-questions">
                <h4>{(selectedScheme || fromSchemePageScheme)?.name}</h4>
                {!fromSchemePageScheme && (
                  <button onClick={() => setSelectedScheme(null)} className="back-btn">
                    {language === 'tamil' ? 'பின்செல்' : 'Back'}
                  </button>
                )}
                
                <div className="question-buttons">
                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'இந்த திட்டத்தைப் பற்றி சொல்லுங்கள்' : 'Tell me about this scheme')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? 'Playing' : 'Audio'} {language === 'tamil' ? 'திட்டத்தைப் பற்றி' : 'About Scheme'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'என்ன ஆவணங்கள் தேவை?' : 'What documents are required?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? 'Playing' : 'Audio'} {language === 'tamil' ? 'ஆவணங்கள்' : 'Documents'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'யார் தகுதியானவர்கள்?' : 'Who is eligible?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? 'Playing' : 'Audio'} {language === 'tamil' ? 'தகுதி' : 'Eligibility'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'எப்படி விண்ணப்பிப்பது?' : 'How to apply?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? 'Playing' : 'Audio'} {language === 'tamil' ? 'விண்ணப்பம்' : 'How to Apply'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'என்ன நன்மைகள்?' : 'What are the benefits?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? 'Playing' : 'Audio'} {language === 'tamil' ? 'நன்மைகள்' : 'Benefits'}
                  </button>
                </div>

                {isPlayingAudio && (
                  <button onClick={stopAudio} className="stop-audio-btn">
                    {language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Stop Audio'}
                  </button>
                )}
              </div>
            )}

            <button 
              onClick={() => { setShowSchemeModal(false); setSelectedScheme(null); stopAudio(); }} 
              className="close-modal-btn"
            >
              {language === 'tamil' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;
