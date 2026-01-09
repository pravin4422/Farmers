import React, { useState, useRef, useEffect } from 'react';
import '../css/AiChat.css';
import '../css/ai-chart.css';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isSpeechRecording, setIsSpeechRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

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
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onresult = event => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        setRecordedText(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setIsSpeechRecording(false);
        }
      };
      
      recognition.onend = () => {
        setIsSpeechRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [language]);

  const handleSend = async (voiceMessage = null) => {
    if (!input.trim() && !voiceMessage) return;

    const userMessage = { 
      role: 'user', 
      content: input || (language === 'tamil' ? 'குரல் செய்தி' : 'Voice Message'),
      audio: voiceMessage || null
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAudioBlob(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (voiceMessage) {
        formData.append('audio', voiceMessage, 'voice-message.wav');
        formData.append('type', 'voice');
      } else {
        formData.append('message', input);
        formData.append('type', 'text');
      }

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMessage]);
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
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          setAudioBlob(blob);
          handleSend(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Microphone access denied. Please allow microphone access.');
      }
    }
  };

  const handleSpeechToText = () => {
    if (!recognitionRef.current) {
      alert(language === 'tamil' ? 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.' : 'Voice input not supported in this browser.');
      return;
    }
    
    if (isSpeechRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsSpeechRecording(false);
    } else {
      setRecordedText('');
      setIsSpeechRecording(true);
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsSpeechRecording(false);
      }
    }
  };

  const addRecordedText = () => {
    if (recordedText) {
      setInput(prev => prev + (prev ? ' ' : '') + recordedText);
      setRecordedText('');
    }
  };

  const cancelRecording = () => {
    if (isSpeechRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setIsSpeechRecording(false);
    setRecordedText('');
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h2>{t.title}</h2>
        <button
          onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
          className="lang-btn"
        >
          {language === 'english' ? 'தமிழ்' : 'English'}
        </button>
      </div>

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
              {msg.audio && msg.audio instanceof Blob ? (
                <div className="voice-message-display">
                  <p className="voice-label">🎤 {msg.content}</p>
                  <audio controls>
                    <source src={URL.createObjectURL(msg.audio)} type="audio/wav" />
                  </audio>
                </div>
              ) : (
                msg.content
              )}
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
          className={`voice-btn speech-to-text ${isSpeechRecording ? 'recording' : ''}`} 
          onClick={handleSpeechToText}
          title={isSpeechRecording ? (language === 'tamil' ? 'நிறுத்து' : 'Stop') : (language === 'tamil' ? 'பேச்சு உரையாக' : 'Speech to Text')}
        >
          {isSpeechRecording ? '⏹️' : '🎤'}
        </button>
        <button 
          className={`voice-btn ${isRecording ? 'recording' : ''}`} 
          onClick={handleVoiceClick}
          title={isRecording ? (language === 'tamil' ? 'நிறுத்து' : 'Stop Recording') : (language === 'tamil' ? 'ஆடியோ பதிவு' : 'Voice Input')}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>
        <button onClick={handleSend} disabled={!input.trim() || loading}>
          {t.send}
        </button>
        
        {recordedText && (
          <div className="recorded-text-preview">
            <span>{recordedText}</span>
            <button type="button" onClick={addRecordedText} className="add-text-btn">✅ {language === 'tamil' ? 'சேர்' : 'Add'}</button>
            <button type="button" onClick={cancelRecording} className="cancel-text-btn">❌</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChat;
