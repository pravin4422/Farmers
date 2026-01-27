import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../context/SeasonContext';
import '../css/Review.css';

function Review() {
  const { season, year } = useSeason();
  const [language, setLanguage] = useState('en');
  const [expiries, setExpiries] = useState([]);
  const [problems, setProblems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Form states
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Problem form states
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [editingProblemId, setEditingProblemId] = useState(null);

  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000/api';

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  useEffect(() => {
    checkAuthentication();
    fetchExpiries();
    fetchProblems();
  }, []);

  const checkAuthentication = () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login', { replace: true });
    }
  };

  const fetchExpiries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expiries`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setExpiries(data);
      }
    } catch (error) {
      console.error('Error fetching expiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setProblems(data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const saveExpiry = async () => {
    if (!productName && !notes) {
      alert(t('Please provide solution name or notes', 'தீர்வு பெயர் அல்லது குறிப்புகளை வழங்கவும்'));
      return;
    }

    setLoading(true);
    
    const expiryData = {
      productName: productName || 'Untitled Solution',
      expiryDate: expiryDate || new Date().toISOString(),
      category: category || 'Other',
      notes,
      season: season || '',
      year: year || ''
    };

    console.log('Sending expiry data:', expiryData);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_BASE_URL}/expiries/${editingId}` 
        : `${API_BASE_URL}/expiries`;
      
      console.log('Request URL:', url);
      console.log('Request method:', method);
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(expiryData),
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        alert(t('Saved successfully!', 'வெற்றிகரமாக சேமிக்கப்பட்டது!'));
        resetForm();
        fetchExpiries();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save expiry');
      }
    } catch (error) {
      console.error('Error saving expiry:', error);
      alert(t('Failed to save. Please try again.', 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setLoading(false);
    }
  };

  const deleteExpiry = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this expiry?', 'இந்த காலாவதியை அழிக்க வேண்டுமா?'))) {
      try {
        const response = await fetch(`${API_BASE_URL}/expiries/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        
        if (response.ok) {
          fetchExpiries();
        }
      } catch (error) {
        console.error('Error deleting expiry:', error);
      }
    }
  };

  const handleEdit = (expiry) => {
    setProductName(expiry.productName);
    setExpiryDate(expiry.expiryDate.split('T')[0]);
    setCategory(expiry.category);
    setNotes(expiry.notes);
    setEditingId(expiry._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setProductName('');
    setExpiryDate('');
    setCategory('');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  const resetProblemForm = () => {
    setProblemTitle('');
    setProblemDescription('');
    setAudioBlob(null);
    setAudioUrl(null);
    setEditingProblemId(null);
    setShowProblemForm(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      alert('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveProblem = async () => {
    if (!problemDescription && !audioBlob) {
      alert(t('Please provide a problem description or voice recording', 'பிரச்சனை விவரத்தை அல்லது குரல் பதிவை வழங்கவும்'));
      return;
    }

    setLoading(true);
    
    const problemData = {
      title: problemTitle || 'Untitled Problem',
      description: problemDescription,
      season: season || '',
      year: year || ''
    };

    try {
      const method = editingProblemId ? 'PUT' : 'POST';
      const url = editingProblemId 
        ? `${API_BASE_URL}/problems/${editingProblemId}` 
        : `${API_BASE_URL}/problems`;
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(problemData),
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        alert(t('Problem saved successfully!', 'பிரச்சனை வெற்றிகரமாக சேமிக்கப்பட்டது!'));
        resetProblemForm();
        fetchProblems();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save problem');
      }
    } catch (error) {
      console.error('Error saving problem:', error);
      alert(t('Failed to save. Please try again.', 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setLoading(false);
    }
  };

  const deleteProblem = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this problem?', 'இந்த பிரச்சனையை அழிக்க வேண்டுமா?'))) {
      try {
        const response = await fetch(`${API_BASE_URL}/problems/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        
        if (response.ok) {
          fetchProblems();
        }
      } catch (error) {
        console.error('Error deleting problem:', error);
      }
    }
  };

  const handleEditProblem = (problem) => {
    setProblemTitle(problem.title);
    setProblemDescription(problem.description);
    setEditingProblemId(problem._id);
    setShowProblemForm(true);
    setShowForm(false);
  };

  const t = (en, ta) => (language === 'ta' ? ta : en);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isExpired = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <>
      <div className="top-bar">
        <h1>{t('Product Expiry Review', 'தயாரிப்பு காலாவதி மதிப்பாய்வு')}</h1>
        <div className="top-actions">
          <button className="toggle-btn" onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
            {t('தமிழ்', 'English')}
          </button>
          <button className="back-btn" onClick={() => navigate('/creator')}>
            {t('Back to Creator', 'உருவாக்குநருக்கு திரும்பு')}
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button className="add-button" onClick={() => {
          setShowForm(!showForm);
          setShowProblemForm(false);
          if (showForm) resetForm();
        }} disabled={loading}>
          {showForm ? t('Cancel', 'ரத்துசெய்') : t('Hypothetical Solution', 'கற்பனை தீர்வு')}
        </button>
        <button className="problem-button" onClick={() => {
          setShowProblemForm(!showProblemForm);
          setShowForm(false);
          if (showProblemForm) resetProblemForm();
        }} disabled={loading}>
          {showProblemForm ? t('Cancel', 'ரத்துசெய்') : t('Report Problem', 'பிரச்சனை அறிவிக்க')}
        </button>
      </div>

      {showProblemForm && (
        <div className="expiry-form">
          <h2>{editingProblemId ? t('Edit Problem', 'பிரச்சனை திருத்த') : t('Report a Problem', 'பிரச்சனை அறிவிக்கவும்')}</h2>

          <label>{t('Problem Title (Optional):', 'பிரச்சனை தலைப்பு (தேர்வு இல்லை):')}</label>
          <input 
            type="text" 
            value={problemTitle} 
            onChange={(e) => setProblemTitle(e.target.value)}
            placeholder={t('Enter problem title', 'பிரச்சனை தலைப்பை உள்ளிடவும்')}
          />

          <label>{t('Problem Description *:', 'பிரச்சனை விவரம் *:')}</label>
          <div className="voice-input-wrapper">
            <textarea 
              value={problemDescription} 
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={t('Describe the problem or use voice input...', 'பிரச்சனையை விவரிக்கவும்...')}
              rows="5"
              className="problem-textarea"
            />
            <div className="voice-button-container">
              {!isRecording ? (
                <button type="button" className="voice-record-btn" onClick={startRecording}>
                  <span className="mic-icon">🎤</span>
                  <span>{t('Start Recording', 'பதிவு துவங்கு')}</span>
                </button>
              ) : (
                <button type="button" className="voice-record-btn recording" onClick={stopRecording}>
                  <span className="stop-icon">⏹️</span>
                  <span>{t('Stop Recording', 'பதிவை நிறுத்து')}</span>
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="audio-player-container">
                <p className="audio-label">🎵 {t('Voice Recording:', 'குரல் பதிவு:')}</p>
                <audio controls src={audioUrl} className="audio-player">
                  Your browser does not support the audio element.
                </audio>
                <button 
                  type="button" 
                  className="remove-audio-btn" 
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                  }}
                >
                  {t('Remove', 'அழிக்க')}
                </button>
              </div>
            )}
          </div>

          <button onClick={saveProblem} disabled={loading} className="save-button">
            {loading} {editingProblemId ? t('Update Problem', 'பிரச்சனை புதுப்பிக்க') : t('Submit Problem', 'பிரச்சனை அனுப்பு')}
          </button>
        </div>
      )}

      {showForm && (
        <div className="expiry-form">
          <h2>{editingId ? t('Edit Solution', 'தீர்வு திருத்த') : t('Add Hypothetical Solution', 'கற்பனை தீர்வு சேர்க்க')}</h2>

          <label>{t('Solution Name (Optional):', 'தீர்வு பெயர் (தேர்வு இல்லை):')}</label>
          <input 
            type="text" 
            value={productName} 
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t('Enter solution name', 'தீர்வு பெயரை உள்ளிடவும்')}
          />

          <label>{t('Notes:', 'குறிப்புகள்:')}</label>
          <div className="voice-input-wrapper">
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('Additional notes...', 'கூடுதல் குறிப்புகள்...')}
              rows="3"
            />
            <div className="voice-button-container">
              {!isRecording ? (
                <button type="button" className="voice-record-btn" onClick={startRecording}>
                  <span className="mic-icon">🎤</span>
                  <span>{t('Start Recording', 'பதிவு துவங்கு')}</span>
                </button>
              ) : (
                <button type="button" className="voice-record-btn recording" onClick={stopRecording}>
                  <span className="stop-icon">⏹️</span>
                  <span>{t('Stop Recording', 'பதிவை நிறுத்து')}</span>
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="audio-player-container">
                <p className="audio-label">🎵 {t('Voice Recording:', 'குரல் பதிவு:')}</p>
                <audio controls src={audioUrl} className="audio-player">
                  Your browser does not support the audio element.
                </audio>
                <button 
                  type="button" 
                  className="remove-audio-btn" 
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                  }}
                >
                   {t('Remove', 'அழிக்க')}
                </button>
              </div>
            )}
          </div>

          <button onClick={saveExpiry} disabled={loading} className="save-button">
            {loading} {t('Save Solution', 'தீர்வு சேமிக்க')}
          </button>
        </div>
      )}

      <div className="expiries-section">
        <h2>{t('Latest Entry', 'சமீபத்திய பதிவு')}</h2>
        
        {loading ? (
          <p>{t('Loading...', 'ஏற்றுகிறது...')}</p>
        ) : expiries.length === 0 && problems.length === 0 ? (
          <p className="no-expiries">{t('No expiries or problems saved yet.', 'இன்னும் காலாவதிகள் அல்லது பிரச்சனைகள் சேமிக்கப்படவில்லை.')}</p>
        ) : (
          <div className="expiries-grid">
            {problems.length > 0 && (
              <div className="expiry-card problem-card">
                <div className="expiry-header">
                  <h3>🔴 {problems[0].title}</h3>
                </div>
                
                <p><strong>{t('Description:', 'விவரம்:')}</strong> {problems[0].description}</p>
                {problems[0].season && <p><strong>{t('Season:', 'பருவம்:')}</strong> {problems[0].season}</p>}
                {problems[0].year && <p><strong>{t('Year:', 'ஆண்டு:')}</strong> {problems[0].year}</p>}
                
                <div className="expiry-actions">
                  <button onClick={() => handleEditProblem(problems[0])} disabled={loading}>
                     {t('Edit', 'திருத்த')}
                  </button>
                  <button onClick={() => deleteProblem(problems[0]._id)} disabled={loading}>
                     {t('Delete', 'அழிக்க')}
                  </button>
                </div>
                
                <p className="expiry-timestamp">
                  {t('Reported:', 'அறிவிக்கப்பட்டது:')} {formatDate(problems[0].createdAt)}
                </p>
              </div>
            )}
            {expiries.length > 0 && (
              <div className="expiry-card">
                <div className="expiry-header">
                  <h3>{expiries[0].productName}</h3>
                </div>
                
                {expiries[0].notes && <p><strong>{t('Notes:', 'குறிப்புகள்:')}</strong> {expiries[0].notes}</p>}
                
                <div className="expiry-actions">
                  <button onClick={() => handleEdit(expiries[0])} disabled={loading}>
                     {t('Edit', 'திருத்த')}
                  </button>
                  <button onClick={() => deleteExpiry(expiries[0]._id)} disabled={loading}>
                     {t('Delete', 'அழிக்க')}
                  </button>
                </div>
                
                <p className="expiry-timestamp">
                  {t('Added:', 'சேர்க்கப்பட்டது:')} {formatDate(expiries[0].createdAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Review;