import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AiChat.css';
import '../css/ai-chart.css';

// Load Puter.js for TTS
if (typeof window !== 'undefined' && !window.puter) {
  const script = document.createElement('script');
  script.src = 'https://js.puter.com/v2/';
  script.async = true;
  script.onload = () => {
    console.log('✅ Puter.js loaded successfully');
    console.log('✅ Puter TTS available:', !!(window.puter?.ai?.txt2speech));
  };
  script.onerror = () => {
    console.error('❌ Failed to load Puter.js');
  };
  document.head.appendChild(script);
}

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
  const [cropRecommendationData, setCropRecommendationData] = useState(null);
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
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
    if (storedPrompt && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setInput(storedPrompt);
      localStorage.removeItem('aiChatPrompt');
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

  const handleSchemeQuestion = async (question) => {
    if (!selectedScheme) return;
    
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
        const prompt = `${question}\n\nScheme: ${selectedScheme.name}\nObjective: ${selectedScheme.details.objective}\nBenefits: ${selectedScheme.details.benefit}\nEligibility: ${selectedScheme.details.eligibility}\nHow to Apply: ${selectedScheme.details.apply}\nDocuments: ${selectedScheme.details.documents}\nWebsite: ${selectedScheme.details.website}`;

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
    console.log('✅ All audio stopped');
  };

  const playAudioResponse = async (text, skipQueue = false) => {
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
    
    try {
      // Check if Puter.js is available
      if (window.puter && window.puter.ai && window.puter.ai.txt2speech) {
        console.log('✅ Puter.js TTS available, generating audio...');
        const voice = language === 'tamil' ? 'nova' : 'alloy';
        console.log('🎤 Using voice:', voice, 'for language:', language);
        
        const audio = await window.puter.ai.txt2speech(text, {
          provider: 'openai',
          voice: voice,
          model: 'gpt-4o-mini-tts',
          response_format: 'mp3'
        });
        
        console.log('✅ Audio generated successfully');
        setIsGeneratingAudio(false);
        setIsPlayingAudio(true);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          console.log('✅ Audio playback ended');
          setIsPlayingAudio(false);
          currentAudioRef.current = null;
          // Process next in queue if any
          if (audioQueueRef.current.length > 0) {
            console.log('▶️ Processing next in queue');
            processAudioQueue();
          }
        };
        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error);
          setIsPlayingAudio(false);
          setIsGeneratingAudio(false);
          currentAudioRef.current = null;
          // Process next in queue if any
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          }
        };
        
        await audio.play();
        console.log('▶️ Audio playing...');
      } else {
        console.warn('⚠️ Puter.js not available, falling back to browser TTS');
        // Fallback to browser TTS if Puter.js is not available
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
            // Process next in queue if any
            if (audioQueueRef.current.length > 0) {
              processAudioQueue();
            }
          };
          utterance.onerror = (error) => {
            console.error('❌ Browser TTS error:', error);
            setIsPlayingAudio(false);
            // Process next in queue if any
            if (audioQueueRef.current.length > 0) {
              processAudioQueue();
            }
          };
          
          window.speechSynthesis.speak(utterance);
        }, 150);
      }
    } catch (error) {
      console.error('❌ TTS error:', error);
      setIsPlayingAudio(false);
      setIsGeneratingAudio(false);
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
            onClick={() => setShowDebug(!showDebug)}
            className="refresh-btn"
            title="Toggle Debug Panel"
          >
            🐛 Debug
          </button>
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
            onClick={() => setShowSchemeModal(true)}
            className="scheme-btn"
          >
            📋 Schemes
          </button>
          <button
            onClick={toggleAutoPlayAudio}
            className={`audio-toggle-btn ${audioMode ? 'active' : ''}`}
            title={audioMode ? (language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Disable Audio Mode') : (language === 'tamil' ? 'ஆடியோவை இயக்கு' : 'Enable Audio Mode')}
            style={{ display: 'none' }}
          >
            {audioMode ? '🔊' : '🔇'} {language === 'tamil' ? (audioMode ? 'ஆடியோ ஆன்' : 'ஆடியோ ஆஃப்') : (audioMode ? 'Audio ON' : 'Audio OFF')}
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
            {msg.role === 'assistant' && (
              <button 
                className="play-message-btn"
                onClick={() => playAudioResponse(msg.content)}
                disabled={isPlayingAudio || isGeneratingAudio}
                title={isGeneratingAudio ? (language === 'tamil' ? 'ஆடியோ உருவாக்கப்படுகிறது...' : 'Generating audio...') : (language === 'tamil' ? 'இந்த செய்தியை கேட்க' : 'Play this message')}
              >
                {isGeneratingAudio ? '⏳' : (isPlayingAudio ? '🔊' : '🔉')}
              </button>
            )}
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
        {(isPlayingAudio || isGeneratingAudio) && (
          <button onClick={stopAudio} className="stop-audio-floating-btn" title={language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Stop Audio'}>
            {isGeneratingAudio ? '⏳' : '⏹️'} {isGeneratingAudio ? (language === 'tamil' ? 'உருவாக்குகிறது...' : 'Generating...') : (language === 'tamil' ? 'நிறுத்து' : 'Stop')}
          </button>
        )}
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

      {/* Scheme Modal */}
      {showSchemeModal && (
        <div className="yield-form-overlay" onClick={() => { setShowSchemeModal(false); stopAudio(); }}>
          <div className="scheme-modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>📋 {language === 'tamil' ? 'அரசு திட்டங்கள்' : 'Government Schemes'}</h3>
            
            {!selectedScheme ? (
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
                <h4>{selectedScheme.name}</h4>
                <button onClick={() => setSelectedScheme(null)} className="back-btn">
                  ← {language === 'tamil' ? 'பின்செல்' : 'Back'}
                </button>
                
                <div className="question-buttons">
                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'இந்த திட்டத்தைப் பற்றி சொல்லுங்கள்' : 'Tell me about this scheme')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? '🔊' : '🎤'} {language === 'tamil' ? 'திட்டத்தைப் பற்றி' : 'About Scheme'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'என்ன ஆவணங்கள் தேவை?' : 'What documents are required?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? '🔊' : '🎤'} {language === 'tamil' ? 'ஆவணங்கள்' : 'Documents'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'யார் தகுதியானவர்கள்?' : 'Who is eligible?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? '🔊' : '🎤'} {language === 'tamil' ? 'தகுதி' : 'Eligibility'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'எப்படி விண்ணப்பிப்பது?' : 'How to apply?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? '🔊' : '🎤'} {language === 'tamil' ? 'விண்ணப்பம்' : 'How to Apply'}
                  </button>

                  <button 
                    onClick={() => handleSchemeQuestion(language === 'tamil' ? 'என்ன நன்மைகள்?' : 'What are the benefits?')}
                    disabled={loading || isPlayingAudio}
                    className="question-btn"
                  >
                    {isPlayingAudio ? '🔊' : '🎤'} {language === 'tamil' ? 'நன்மைகள்' : 'Benefits'}
                  </button>
                </div>

                {isPlayingAudio && (
                  <button onClick={stopAudio} className="stop-audio-btn">
                    ⏹️ {language === 'tamil' ? 'ஆடியோவை நிறுத்து' : 'Stop Audio'}
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
