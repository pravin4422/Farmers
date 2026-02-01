import React, { useState, useEffect, useRef } from "react";
import '../../css/FarmerLibrary/FarmerLibrary.css';

const FarmerLibrary = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isRecording, setIsRecording] = useState({ symptoms: false, description: false, solution: false });
  const [recordingTime, setRecordingTime] = useState({ symptoms: 0, description: 0, solution: 0 });
  const [voiceBlobs, setVoiceBlobs] = useState({ symptoms: null, description: null, solution: null });
  const mediaRecorderRef = useRef({ symptoms: null, description: null, solution: null });
  const timerRef = useRef({ symptoms: null, description: null, solution: null });
  const [formData, setFormData] = useState({
    problemTitle: '',
    category: '',
    severity: '',
    description: '',
    solution: '',
    cropAffected: '',
    symptoms: ''
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        window.location.href = '/login';
        return;
      }
      const response = await fetch('http://localhost:5000/api/library/problems', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        alert('Session expired. Please login again');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      setProblems(Array.isArray(data) ? data : []);
      setTotalCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setProblems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = async (field) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current[field] = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceBlobs(prev => ({ ...prev, [field]: blob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(prev => ({ ...prev, [field]: true }));
      setRecordingTime(prev => ({ ...prev, [field]: 0 }));
      timerRef.current[field] = setInterval(() => {
        setRecordingTime(prev => {
          if (prev[field] >= 119) {
            stopVoiceInput(field);
            return { ...prev, [field]: 120 };
          }
          return { ...prev, [field]: prev[field] + 1 };
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceInput = (field) => {
    if (mediaRecorderRef.current[field] && isRecording[field]) {
      mediaRecorderRef.current[field].stop();
      setIsRecording(prev => ({ ...prev, [field]: false }));
      clearInterval(timerRef.current[field]);
    }
  };

  const deleteVoice = (field) => {
    setVoiceBlobs(prev => ({ ...prev, [field]: null }));
    setRecordingTime(prev => ({ ...prev, [field]: 0 }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkDuplicate = () => {
    if (!formData.problemTitle && !formData.cropAffected) {
      return false;
    }
    const similar = problems.find(p => 
      (formData.problemTitle && p.problemTitle?.toLowerCase().includes(formData.problemTitle.toLowerCase())) ||
      (formData.cropAffected && formData.category && 
       p.cropAffected?.toLowerCase() === formData.cropAffected.toLowerCase() && 
       p.category === formData.category)
    );
    if (similar) {
      setDuplicateWarning(`Similar problem found: "${similar.problemTitle}" for ${similar.cropAffected}`);
      return true;
    }
    setDuplicateWarning('');
    return false;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!formData.symptoms.trim() && !voiceBlobs.symptoms) {
      alert('Please provide symptoms (text or voice)');
      return;
    }
    if (!formData.description.trim() && !voiceBlobs.description) {
      alert('Please provide description (text or voice)');
      return;
    }
    if (!formData.solution.trim() && !voiceBlobs.solution) {
      alert('Please provide solution (text or voice)');
      return;
    }
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    if (!formData.severity) {
      alert('Please select severity');
      return;
    }

    if (checkDuplicate()) {
      if (!window.confirm('A similar problem already exists. Do you still want to add this?')) return;
    }

    let symptomsVoiceData = null;
    if (voiceBlobs.symptoms) {
      const reader = new FileReader();
      symptomsVoiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(voiceBlobs.symptoms);
      });
    }

    let descriptionVoiceData = null;
    if (voiceBlobs.description) {
      const reader = new FileReader();
      descriptionVoiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(voiceBlobs.description);
      });
    }

    let solutionVoiceData = null;
    if (voiceBlobs.solution) {
      const reader = new FileReader();
      solutionVoiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(voiceBlobs.solution);
      });
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        window.location.href = '/login';
        return;
      }
      const response = await fetch('http://localhost:5000/api/library/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms || 'Voice message',
          description: formData.description || 'Voice message',
          solution: formData.solution || 'Voice message',
          symptomsVoice: symptomsVoiceData,
          descriptionVoice: descriptionVoiceData,
          solutionVoice: solutionVoiceData
        })
      });
      if (response.status === 401) {
        alert('Session expired. Please login again');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      if (response.ok) {
        fetchProblems();
        setFormData({ problemTitle: '', category: '', severity: '', description: '', solution: '', cropAffected: '', symptoms: '' });
        setVoiceBlobs({ symptoms: null, description: null, solution: null });
        setRecordingTime({ symptoms: 0, description: 0, solution: 0 });
        setShowAddForm(false);
        setDuplicateWarning('');
        alert('Problem added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add problem: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error adding problem:', error);
      alert('Failed to add problem. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/library/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredProblems = (Array.isArray(problems) ? problems : []).filter(item => {
    const matchesSearch = !searchQuery || 
      item.problemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cropAffected?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSeverity = !filterSeverity || item.severity === filterSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const displayProblems = searchQuery || filterCategory || filterSeverity ? filteredProblems : filteredProblems.slice(0, 5);

  return (
    <div className="library-container">
      <div className="header-with-count">
        <h2>Agricultural Problem Library</h2>
        <div className="problem-count">Total Problems: {totalCount}</div>
      </div>
      <p>Search for farming problems and find solutions. Add new problems only if not found.</p>

      {loading ? (
        <p className="loading">Loading problems...</p>
      ) : (
        <>
          <div className="search-section">
            <input 
              type="text" 
              placeholder="🔍 Search by problem, crop, or symptoms..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="main-search"
            />
            <div className="filters">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Pest Infestation">Pest Infestation</option>
                <option value="Disease">Disease</option>
                <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                <option value="Water Management">Water Management</option>
                <option value="Soil Issue">Soil Issue</option>
                <option value="Weather Damage">Weather Damage</option>
                <option value="Weed Problem">Weed Problem</option>
              </select>
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                <option value="">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <button onClick={() => setShowAddForm(!showAddForm)} className="add-toggle-btn">
                {showAddForm ? 'Cancel' : 'Add New Problem'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="add-form">
              <h3>Add New Farming Problem</h3>
              {duplicateWarning && <div className="warning-msg">{duplicateWarning}</div>}
              <form onSubmit={handleAdd}>
              <input type="text" name="problemTitle" placeholder="Problem Title (Optional)" value={formData.problemTitle} onChange={handleChange} />
              <input type="text" name="cropAffected" placeholder="Crop Affected (Optional)" value={formData.cropAffected} onChange={handleChange} />
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Pest Infestation">Pest Infestation</option>
                <option value="Disease">Disease</option>
                <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                <option value="Water Management">Water Management</option>
                <option value="Soil Issue">Soil Issue</option>
                <option value="Weather Damage">Weather Damage</option>
                <option value="Weed Problem">Weed Problem</option>
              </select>
              <select name="severity" value={formData.severity} onChange={handleChange} required>
                <option value="">Select Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <div className="voice-input-wrapper">
                <textarea name="symptoms" placeholder="Symptoms" value={formData.symptoms} onChange={handleChange} />
                <div className="voice-controls-inline">
                  <button 
                    type="button" 
                    onClick={() => isRecording.symptoms ? stopVoiceInput('symptoms') : startVoiceInput('symptoms')} 
                    className={`voice-btn ${isRecording.symptoms ? 'recording' : ''}`}
                  >
                    {isRecording.symptoms ? '⏹️' : '🎤'}
                  </button>
                  {isRecording.symptoms && <span className="voice-timer">{formatTime(recordingTime.symptoms)}</span>}
                </div>
              </div>
              {voiceBlobs.symptoms && !isRecording.symptoms && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <audio controls className="voice-preview" src={URL.createObjectURL(voiceBlobs.symptoms)} />
                  <button type="button" onClick={() => deleteVoice('symptoms')} className="voice-delete-btn">🗑️</button>
                </div>
              )}
              <div className="voice-input-wrapper">
                <textarea name="description" placeholder="Problem Description" value={formData.description} onChange={handleChange} />
                <div className="voice-controls-inline">
                  <button 
                    type="button" 
                    onClick={() => isRecording.description ? stopVoiceInput('description') : startVoiceInput('description')} 
                    className={`voice-btn ${isRecording.description ? 'recording' : ''}`}
                  >
                    {isRecording.description ? '⏹️' : '🎤'}
                  </button>
                  {isRecording.description && <span className="voice-timer">{formatTime(recordingTime.description)}</span>}
                </div>
              </div>
              {voiceBlobs.description && !isRecording.description && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <audio controls className="voice-preview" src={URL.createObjectURL(voiceBlobs.description)} />
                  <button type="button" onClick={() => deleteVoice('description')} className="voice-delete-btn">🗑️</button>
                </div>
              )}
              <div className="voice-input-wrapper">
                <textarea name="solution" placeholder="Solution/Treatment" value={formData.solution} onChange={handleChange} />
                <div className="voice-controls-inline">
                  <button 
                    type="button" 
                    onClick={() => isRecording.solution ? stopVoiceInput('solution') : startVoiceInput('solution')} 
                    className={`voice-btn ${isRecording.solution ? 'recording' : ''}`}
                  >
                    {isRecording.solution ? '⏹️' : '🎤'}
                  </button>
                  {isRecording.solution && <span className="voice-timer">{formatTime(recordingTime.solution)}</span>}
                </div>
              </div>
              {voiceBlobs.solution && !isRecording.solution && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <audio controls className="voice-preview" src={URL.createObjectURL(voiceBlobs.solution)} />
                  <button type="button" onClick={() => deleteVoice('solution')} className="voice-delete-btn">🗑️</button>
                </div>
              )}
              <button type="submit">✓ Add Problem</button>
            </form>
            </div>
          )}

          {displayProblems.length > 0 && (
            <>
              <h3>{searchQuery || filterCategory || filterSeverity ? `Search Results (${displayProblems.length} found)` : `Latest 5 Problems`}</h3>
              <div className="resources-grid">
                {displayProblems.map((item, idx) => (
              <div key={item._id || idx} className="resource-card">
                <div className="resource-header">
                  <span className={`severity-badge ${item.severity?.toLowerCase()}`}>{item.severity}</span>
                  <span className="resource-category">{item.category}</span>
                </div>
                <h4>{item.problemTitle || 'Untitled Problem'}</h4>
                <p className="crop-affected">Crop: {item.cropAffected || 'Not specified'}</p>
                <div className="problem-section">
                  <strong>Symptoms:</strong>
                  <p>{item.symptoms}</p>
                  {item.symptomsVoice && <audio controls style={{ width: '100%', marginTop: '8px' }} src={item.symptomsVoice} />}
                </div>
                <div className="problem-section">
                  <strong>Description:</strong>
                  <p>{item.description}</p>
                  {item.descriptionVoice && <audio controls style={{ width: '100%', marginTop: '8px' }} src={item.descriptionVoice} />}
                </div>
                <div className="problem-section solution">
                  <strong>Solution:</strong>
                  <p>{item.solution}</p>
                  {item.solutionVoice && <audio controls style={{ width: '100%', marginTop: '8px' }} src={item.solutionVoice} />}
                </div>
                <div className="resource-actions">
                  <button onClick={() => handleDelete(item._id)} className="delete-btn">Delete</button>
                </div>
              </div>
                ))}
              </div>
            </>
          )}
          {displayProblems.length === 0 && (
            <div className="no-data">
              <p>No problems found matching your search.</p>
              <p>Try different keywords or add a new problem if it doesn't exist.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FarmerLibrary;
