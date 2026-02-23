import React, { useState, useEffect, useRef } from 'react';
import '../css/CommonForum.css';

function CommonForum() {
  const [discussions, setDiscussions] = useState([]);
  const [validatedSolutions, setValidatedSolutions] = useState([]);
  const [discussionData, setDiscussionData] = useState({ question: '' });
  const [solutionData, setSolutionData] = useState({});
  const [adminPostData, setAdminPostData] = useState({ problem: '', solution: '', pros: '', cons: '' });
  const [editingId, setEditingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isListening, setIsListening] = useState({});
  const [audioBlob, setAudioBlob] = useState({});
  const [isRecording, setIsRecording] = useState({});
  const [recordingTime, setRecordingTime] = useState({});
  const mediaRecorderRef = useRef({});
  const timerRef = useRef({});

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    console.log('CommonForum - isAdmin status:', adminStatus);
    setIsAdmin(adminStatus);
    fetchDiscussions();
    fetchValidatedSolutions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/common-forum/discussions');
      const data = await response.json();
      setDiscussions(data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const fetchValidatedSolutions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/common-forum/validated');
      const data = await response.json();
      setValidatedSolutions(data);
    } catch (error) {
      console.error('Error fetching validated solutions:', error);
    }
  };

  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to post a question');
        return;
      }
      const userName = localStorage.getItem('displayName') || localStorage.getItem('userEmail');
      const response = await fetch('http://localhost:5000/api/common-forum/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...discussionData, userName })
      });
      if (response.ok) {
        fetchDiscussions();
        setDiscussionData({ question: '' });
        alert('Question posted successfully!');
      }
    } catch (error) {
      console.error('Error adding discussion:', error);
    }
  };

  const handleSolutionSubmit = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('displayName') || localStorage.getItem('userEmail');
      const response = await fetch(`http://localhost:5000/api/common-forum/discussions/${discussionId}/solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ solution: solutionData[discussionId], userName })
      });
      
      if (response.ok) {
        const result = await response.json();
        fetchDiscussions();
        setSolutionData({ ...solutionData, [discussionId]: '' });
        
        if (result.aiValidation) {
          alert(`✅ Solution submitted!\n\n🤖 AI Score: ${result.aiValidation.score}/100\nFeedback: ${result.aiValidation.reason}`);
        } else {
          alert('Solution submitted!');
        }
      } else {
        const error = await response.json();
        if (error.aiScore !== undefined) {
          alert(`❌ Solution rejected by AI\n\nScore: ${error.aiScore}/100\nReason: ${error.aiReason}\n\nPlease improve your solution.`);
        } else {
          alert('Error: ' + error.message);
        }
      }
    } catch (error) {
      console.error('Error adding solution:', error);
      alert('Error: ' + error.message);
    }
  };

  const startAdminVoiceInput = (field) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening({ ...isListening, [`admin-${field}`]: true });
      finalTranscript = '';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const currentValue = adminPostData[field] || '';
      const displayText = currentValue + finalTranscript + interimTranscript;
      setAdminPostData({ ...adminPostData, [field]: displayText.trim() });
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        alert('Voice input error: ' + event.error);
      }
      setIsListening({ ...isListening, [`admin-${field}`]: false });
    };

    recognition.onend = () => {
      setIsListening({ ...isListening, [`admin-${field}`]: false });
      if (finalTranscript) {
        const currentValue = adminPostData[field] || '';
        const newValue = currentValue ? `${currentValue} ${finalTranscript}`.trim() : finalTranscript.trim();
        setAdminPostData({ ...adminPostData, [field]: newValue });
      }
    };

    recognition.start();
  };

  const startAudioRecording = async (field) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current[field] = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob({ ...audioBlob, [field]: blob });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording({ ...isRecording, [field]: true });
      setRecordingTime({ ...recordingTime, [field]: 0 });
      timerRef.current[field] = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = (prev[field] || 0) + 1;
          if (newTime >= 180) {
            stopAudioRecording(field);
            return { ...prev, [field]: 180 };
          }
          return { ...prev, [field]: newTime };
        });
      }, 1000);
    } catch (err) {
      alert('Could not access microphone');
    }
  };

  const stopAudioRecording = (field) => {
    if (mediaRecorderRef.current[field] && isRecording[field]) {
      mediaRecorderRef.current[field].stop();
      setIsRecording({ ...isRecording, [field]: false });
      clearInterval(timerRef.current[field]);
    }
  };

  const deleteAudio = (field) => {
    setAudioBlob({ ...audioBlob, [field]: null });
    setRecordingTime({ ...recordingTime, [field]: 0 });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAdminPost = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Only validated users can post solutions.');
      return;
    }
    
    
    if (!adminPostData.problem && !audioBlob['admin-problem']) {
      alert('Please provide problem (text or audio)');
      return;
    }
    if (!adminPostData.solution && !audioBlob['admin-solution']) {
      alert('Please provide solution (text or audio)');
      return;
    }
    if (!adminPostData.pros && !audioBlob['admin-pros']) {
      alert('Please provide pros (text or audio)');
      return;
    }
    if (!adminPostData.cons && !audioBlob['admin-cons']) {
      alert('Please provide cons (text or audio)');
      return;
    }

    console.log('Submitting:', adminPostData);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login as admin');
        return;
      }

      const postData = { 
        problem: adminPostData.problem || 'Audio Message',
        solution: adminPostData.solution || 'Audio Message',
        pros: adminPostData.pros || 'Audio Message',
        cons: adminPostData.cons || 'Audio Message'
      };
      
      
      if (audioBlob['admin-problem']) {
        const reader = new FileReader();
        postData.problemAudio = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob['admin-problem']);
        });
      }
      if (audioBlob['admin-solution']) {
        const reader = new FileReader();
        postData.solutionAudio = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob['admin-solution']);
        });
      }
      if (audioBlob['admin-pros']) {
        const reader = new FileReader();
        postData.prosAudio = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob['admin-pros']);
        });
      }
      if (audioBlob['admin-cons']) {
        const reader = new FileReader();
        postData.consAudio = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob['admin-cons']);
        });
      }

      const url = editingId 
        ? `http://localhost:5000/api/common-forum/validated/${editingId}`
        : 'http://localhost:5000/api/common-forum/validated-post';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        const result = await response.json();
        fetchValidatedSolutions();
        setAdminPostData({ problem: '', solution: '', pros: '', cons: '' });
        setAudioBlob({});
        setEditingId(null);
        
        if (result.aiValidation) {
          alert(`✅ Solution posted successfully!\n\n🤖 AI Validation:\nScore: ${result.aiValidation.score}/100\nReason: ${result.aiValidation.reason}`);
        } else {
          alert(editingId ? 'Solution updated!' : 'Solution posted successfully!');
        }
      } else {
        const error = await response.json();
        console.error('Server error:', error);
        if (error.aiScore !== undefined) {
          alert(`❌ AI Validation Failed\n\nScore: ${error.aiScore}/100\nReason: ${error.aiReason}\n\nPlease improve your solution.`);
        } else if (error.message === 'Admin access required') {
          alert('Admin access required. Please login as admin@gmail.com');
        } else {
          alert('Error: ' + (error.message || 'Failed to post'));
        }
      }
    } catch (error) {
      console.error('Error posting solution:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setAdminPostData({
      problem: item.question,
      solution: item.validatedSolution.solution,
      pros: item.validatedSolution.pros,
      cons: item.validatedSolution.cons
    });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this solution?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/common-forum/validated/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchValidatedSolutions();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDeleteDiscussion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/common-forum/discussions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDiscussions();
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  return (
    <div className="common-forum">
      <h2>Validated Solutions</h2>
      
      {!isAdmin && (
        <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#856404'}}>
          <strong>ℹ️ Information:</strong> You can view all solutions. To post/edit/delete solutions, you need to meet one of these criteria:
          <ul style={{marginTop: '10px', marginBottom: '0'}}>
            <li>Agricultural Officer (with education experience)</li>
            <li>Senior Expert (Age 40+ with 10+ years experience)</li>
            <li>Crop Expert (5+ years experience with main crop)</li>
          </ul>
        </div>
      )}
      
      {isAdmin && (
        <form onSubmit={handleAdminPost} className="admin-post-form">
          <h3>{editingId ? 'Edit Solution' : 'Post Best Solution'}</h3>
          <div className="input-group">
            <textarea 
              placeholder="Agricultural problem..." 
              value={adminPostData.problem} 
              onChange={(e) => setAdminPostData({...adminPostData, problem: e.target.value})}
              required={!audioBlob['admin-problem']}
            />
            <button type="button" onClick={() => isRecording['admin-problem'] ? stopAudioRecording('admin-problem') : startAudioRecording('admin-problem')} className="audio-btn" title="Record audio">
              {isRecording['admin-problem'] ? '⏹️' : '🎙️'}
            </button>
            {audioBlob['admin-problem'] && (
              <button type="button" onClick={() => deleteAudio('admin-problem')} className="delete-audio-btn">🗑️</button>
            )}
          </div>
          {audioBlob['admin-problem'] && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob['admin-problem'])} style={{width: '100%', marginBottom: '12px'}} />
              <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                Recording: {formatTime(recordingTime['admin-problem'] || 0)}
              </div>
            </>
          )}
          {isRecording['admin-problem'] && (
            <div style={{fontSize: '12px', color: '#dc3545', marginBottom: '12px', fontWeight: 'bold'}}>
              🔴 Recording: {formatTime(recordingTime['admin-problem'] || 0)}
            </div>
          )}
          <div className="input-group">
            <textarea 
              placeholder="Best solution..." 
              value={adminPostData.solution} 
              onChange={(e) => setAdminPostData({...adminPostData, solution: e.target.value})}
              required={!audioBlob['admin-solution']}
            />
            <button type="button" onClick={() => isRecording['admin-solution'] ? stopAudioRecording('admin-solution') : startAudioRecording('admin-solution')} className="audio-btn" title="Record audio">
              {isRecording['admin-solution'] ? '⏹️' : '🎙️'}
            </button>
            {audioBlob['admin-solution'] && (
              <button type="button" onClick={() => deleteAudio('admin-solution')} className="delete-audio-btn">🗑️</button>
            )}
          </div>
          {audioBlob['admin-solution'] && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob['admin-solution'])} style={{width: '100%', marginBottom: '12px'}} />
              <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                Recording: {formatTime(recordingTime['admin-solution'] || 0)}
              </div>
            </>
          )}
          {isRecording['admin-solution'] && (
            <div style={{fontSize: '12px', color: '#dc3545', marginBottom: '12px', fontWeight: 'bold'}}>
              🔴 Recording: {formatTime(recordingTime['admin-solution'] || 0)}
            </div>
          )}
          <div className="input-group">
            <textarea 
              placeholder="Pros (Good points)..." 
              value={adminPostData.pros} 
              onChange={(e) => setAdminPostData({...adminPostData, pros: e.target.value})}
              required={!audioBlob['admin-pros']}
            />
            <button type="button" onClick={() => isRecording['admin-pros'] ? stopAudioRecording('admin-pros') : startAudioRecording('admin-pros')} className="audio-btn" title="Record audio">
              {isRecording['admin-pros'] ? '⏹️' : '🎙️'}
            </button>
            {audioBlob['admin-pros'] && (
              <button type="button" onClick={() => deleteAudio('admin-pros')} className="delete-audio-btn">🗑️</button>
            )}
          </div>
          {audioBlob['admin-pros'] && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob['admin-pros'])} style={{width: '100%', marginBottom: '12px'}} />
              <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                Recording: {formatTime(recordingTime['admin-pros'] || 0)}
              </div>
            </>
          )}
          {isRecording['admin-pros'] && (
            <div style={{fontSize: '12px', color: '#dc3545', marginBottom: '12px', fontWeight: 'bold'}}>
              🔴 Recording: {formatTime(recordingTime['admin-pros'] || 0)}
            </div>
          )}
          <div className="input-group">
            <textarea 
              placeholder="Cons (Bad points)..." 
              value={adminPostData.cons} 
              onChange={(e) => setAdminPostData({...adminPostData, cons: e.target.value})}
              required={!audioBlob['admin-cons']}
            />
            <button type="button" onClick={() => isRecording['admin-cons'] ? stopAudioRecording('admin-cons') : startAudioRecording('admin-cons')} className="audio-btn" title="Record audio">
              {isRecording['admin-cons'] ? '⏹️' : '🎙️'}
            </button>
            {audioBlob['admin-cons'] && (
              <button type="button" onClick={() => deleteAudio('admin-cons')} className="delete-audio-btn">🗑️</button>
            )}
          </div>
          {audioBlob['admin-cons'] && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob['admin-cons'])} style={{width: '100%', marginBottom: '12px'}} />
              <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                Recording: {formatTime(recordingTime['admin-cons'] || 0)}
              </div>
            </>
          )}
          {isRecording['admin-cons'] && (
            <div style={{fontSize: '12px', color: '#dc3545', marginBottom: '12px', fontWeight: 'bold'}}>
              🔴 Recording: {formatTime(recordingTime['admin-cons'] || 0)}
            </div>
          )}
          <button type="submit" className="submit-btn">{editingId ? 'Update Solution' : 'Post Solution'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setAdminPostData({ problem: '', solution: '', pros: '', cons: '' }); }} className="cancel-btn">Cancel</button>}
        </form>
      )}

      <div className="validated-section">
        {validatedSolutions.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#777', background: '#f8f9fa', borderRadius: '8px'}}>
            No validated solutions posted yet. {isAdmin && 'Use the form above to post the first solution!'}
          </div>
        ) : (
          validatedSolutions.map((item) => (
            <div key={item._id} className="validated-card">
              <div className="problem">
                <strong>Problem:</strong> {item.question}
                <small>Asked by {item.userName}</small>
              </div>
              <div className="solution">
                <strong>✓ Best Solution:</strong>
                {item.validatedSolution.solutionAudio ? (
                  <audio controls src={item.validatedSolution.solutionAudio} style={{width: '100%', marginTop: '8px'}} />
                ) : (
                  <p>{item.validatedSolution.solution}</p>
                )}
                <div className="pros-cons">
                  <div className="pros">
                    <strong>Pros:</strong>
                    {item.validatedSolution.prosAudio ? (
                      <audio controls src={item.validatedSolution.prosAudio} style={{width: '100%', marginTop: '8px'}} />
                    ) : (
                      <p>{item.validatedSolution.pros}</p>
                    )}
                  </div>
                  <div className="cons">
                    <strong>Cons:</strong>
                    {item.validatedSolution.consAudio ? (
                      <audio controls src={item.validatedSolution.consAudio} style={{width: '100%', marginTop: '8px'}} />
                    ) : (
                      <p>{item.validatedSolution.cons}</p>
                    )}
                  </div>
                </div>
                <small>Validated by {item.validatedSolution.validatedBy} on {new Date(item.validatedSolution.validatedAt).toLocaleDateString()}</small>
              </div>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="delete-btn">Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommonForum;
