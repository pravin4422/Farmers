import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AiChat from './AiChat';
import '../css/AiHome.css';

const CropPrediction = ({ onAskAI }) => {
  const districts = ['ARIYALUR', 'CHENNAI', 'COIMBATORE', 'CUDDALORE', 'DHARMAPURI', 'DINDIGUL', 'ERODE', 'KANCHIPURAM', 'KANNIYAKUMARI', 'KARUR', 'KRISHNAGIRI', 'MADURAI', 'NAGAPATTINAM', 'NAMAKKAL', 'PERAMBALUR', 'PUDUKKOTTAI', 'RAMANATHAPURAM', 'SALEM', 'SIVAGANGA', 'THANJAVUR', 'THE NILGIRIS', 'THENI', 'THIRUVALLUR', 'THIRUVARUR', 'TIRUCHIRAPPALLI', 'TIRUNELVELI', 'TIRUPPUR', 'TIRUVANNAMALAI', 'TUTICORIN', 'VELLORE'];
  const seasons = ['AUTUMN', 'KHARIF', 'RABI', 'SUMMER', 'WHOLE YEAR', 'WINTER'];
  
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    season: '',
    year: '',
    area: ''
  });
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setPrediction(data.recommended_crop || data.crop || data.prediction || 'Unable to predict');
    } catch (error) {
      console.error('Prediction error:', error);
      setPrediction('Error predicting crop');
    } finally {
      setLoading(false);
    }
  };

  const setDefaults = () => {
    const defaultData = [
      { state: 'Tamil Nadu', district: 'ARIYALUR', year: '2008', season: 'AUTUMN', area: '1298' },
      { state: 'Tamil Nadu', district: 'ARIYALUR', year: '2008', season: 'KHARIF', area: '12' },
      { state: 'Tamil Nadu', district: 'ARIYALUR', year: '2008', season: 'KHARIF', area: '2' },
      { state: 'Tamil Nadu', district: 'ARIYALUR', year: '2008', season: 'RABI', area: '99' }
    ];
    const randomData = defaultData[Math.floor(Math.random() * defaultData.length)];
    setFormData(randomData);
    setPrediction('');
  };

  const handleAskAI = () => {
    onAskAI(`Tell me more about ${prediction} crop cultivation and how was my previous cultivation for ${prediction} crop`);
  };

  return (
    <div className="prediction-form-container">
      <h2>Crop Prediction</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={formData.state}
          onChange={(e) => setFormData({...formData, state: e.target.value})}
          required
        >
          <option value="">Select State</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
        </select>
        <select
          value={formData.district}
          onChange={(e) => setFormData({...formData, district: e.target.value})}
          required
        >
          <option value="">Select District</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={formData.season}
          onChange={(e) => setFormData({...formData, season: e.target.value})}
          required
        >
          <option value="">Select Season</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={(e) => setFormData({...formData, year: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Cultivated Area (hectares)"
          value={formData.area}
          onChange={(e) => setFormData({...formData, area: e.target.value})}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Crop'}
        </button>
        <button type="button" onClick={setDefaults}>
          Set Default
        </button>
      </form>
      {prediction && (
        <div className="prediction-result">
          <h3>Predicted Crop:</h3>
          <p>{prediction}</p>
          <button onClick={handleAskAI} style={{marginTop: '15px'}}>
            Ask AI for More Details
          </button>
        </div>
      )}
    </div>
  );
};

const YieldPrediction = ({ onAskAI }) => {
  const crops = ['Arecanut', 'Arhar/Tur', 'Castor seed', 'Coconut ', 'Cotton(lint)', 'Dry chillies', 'Gram', 'Jute', 'Linseed', 'Maize', 'Mesta', 'Niger seed', 'Onion', 'Other  Rabi pulses', 'Potato', 'Rapeseed &Mustard', 'Rice', 'Sesamum', 'Small millets', 'Sugarcane', 'Sweet potato', 'Tapioca', 'Tobacco', 'Turmeric', 'Wheat', 'Bajra', 'Black pepper', 'Cardamom', 'Coriander', 'Garlic', 'Ginger', 'Groundnut', 'Horse-gram', 'Jowar', 'Ragi', 'Cashewnut', 'Banana', 'Soyabean', 'Barley', 'Khesari', 'Masoor', 'Moong(Green Gram)', 'Other Kharif pulses', 'Safflower', 'Sannhamp', 'Sunflower', 'Urad', 'Peas & beans (Pulses)', 'other oilseeds', 'Other Cereals', 'Cowpea(Lobia)', 'Oilseeds total', 'Guar seed', 'Other Summer Pulses', 'Moth'];
  const seasons = ['Whole Year ', 'Kharif     ', 'Rabi       ', 'Autumn     ', 'Summer     ', 'Winter     '];
  const [states, setStates] = useState([]);
  
  const [formData, setFormData] = useState({
    crop: '',
    crop_year: '',
    season: '',
    state: '',
    area: '',
    annual_rainfall: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useState(() => {
    fetch('http://127.0.0.1:5002/get_options')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStates(data.options.states);
        }
      })
      .catch(err => console.error('Failed to load options:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5002/predict_yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPrediction(data);
      } else {
        setPrediction({ error: data.message || 'Unable to predict' });
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setPrediction({ error: 'Error predicting yield' });
    } finally {
      setLoading(false);
    }
  };

  const setDefaults = () => {
    const defaultData = [
      { crop: 'Cotton(lint)', crop_year: '2000', season: 'Kharif     ', state: 'Andhra Pradesh', area: '1021721.0', annual_rainfall: '935.6' },
      { crop: 'Turmeric', crop_year: '2002', season: 'Whole Year ', state: 'Kerala', area: '3140', annual_rainfall: '2511.2' },
      { crop: 'other oilseeds', crop_year: '2002', season: 'Whole Year ', state: 'Kerala', area: '2253', annual_rainfall: '2511.2' },
      { crop: 'Arecanut', crop_year: '2002', season: 'Whole Year ', state: 'Tamil Nadu', area: '4956', annual_rainfall: '315.9' },
      { crop: 'Arhar/Tur', crop_year: '2002', season: 'Kharif     ', state: 'Tamil Nadu', area: '44127', annual_rainfall: '315.9' },
      { crop: 'Bajra', crop_year: '2002', season: 'Kharif     ', state: 'Tamil Nadu', area: '102020', annual_rainfall: '315.9' },
      { crop: 'Banana', crop_year: '2002', season: 'Whole Year ', state: 'Tamil Nadu', area: '76771', annual_rainfall: '315.9' }
    ];
    const randomData = defaultData[Math.floor(Math.random() * defaultData.length)];
    setFormData(randomData);
    setPrediction(null);
  };

  const handleAskAI = () => {
    const message = `Is the yield of ${prediction.predicted_yield} okay for ${formData.crop} in ${formData.state}, ${formData.season} season, ${formData.area} hectares with ${formData.annual_rainfall}mm rainfall?`;
    onAskAI(message);
  };

  return (
    <div className="prediction-form-container">
      <h2>Yield Prediction</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={formData.crop}
          onChange={(e) => setFormData({...formData, crop: e.target.value})}
          required
        >
          <option value="">Select Crop</option>
          {crops.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          placeholder="Year (e.g., 2000)"
          value={formData.crop_year}
          onChange={(e) => setFormData({...formData, crop_year: e.target.value})}
          required
        />
        <select
          value={formData.season}
          onChange={(e) => setFormData({...formData, season: e.target.value})}
          required
        >
          <option value="">Select Season</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={formData.state}
          onChange={(e) => setFormData({...formData, state: e.target.value})}
          required
        >
          <option value="">Select State</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Area (hectares) - e.g., 1021721.0"
          value={formData.area}
          onChange={(e) => setFormData({...formData, area: e.target.value})}
          required
        />
        <input
          type="number"
          step="0.1"
          placeholder="Annual Rainfall (mm) - e.g., 935.6"
          value={formData.annual_rainfall}
          onChange={(e) => setFormData({...formData, annual_rainfall: e.target.value})}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Yield'}
        </button>
        <button type="button" onClick={setDefaults}>
          Set Default
        </button>
      </form>
      {prediction && (
        <div className="prediction-result">
          {prediction.error ? (
            <p className="error">{prediction.error}</p>
          ) : (
            <>
              <h3>Predicted Yield: {prediction.predicted_yield}</h3>
              <div className="input-details">
                <p><strong>Crop:</strong> {prediction.input_details.crop}</p>
                <p><strong>Year:</strong> {prediction.input_details.year}</p>
                <p><strong>Season:</strong> {prediction.input_details.season}</p>
                <p><strong>State:</strong> {prediction.input_details.state}</p>
                <p><strong>Area:</strong> {prediction.input_details.area} hectares</p>
                <p><strong>Annual Rainfall:</strong> {prediction.input_details.annual_rainfall} mm</p>
              </div>
              <button onClick={handleAskAI} style={{marginTop: '15px'}}>
                Ask AI for More Details
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const DiseasePrediction = ({ onAskAI }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setPrediction(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('http://localhost:5000/api/predict/disease', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      setPrediction({
        disease: data.disease || data.prediction || 'Unknown Disease',
        details: data.details || data.description || 'No details available'
      });
    } catch (error) {
      console.error('Disease prediction error:', error);
      setPrediction({
        disease: 'Error',
        details: 'Failed to predict disease. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = () => {
    onAskAI(`Tell me more about ${prediction.disease} disease in plants`);
  };

  return (
    <div className="prediction-form-container">
      <h2>Disease Prediction</h2>
      <form onSubmit={handleSubmit}>
        <div className="image-upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            id="image-upload"
            style={{display: 'none'}}
            required
          />
          <label htmlFor="image-upload" className="upload-label">
            {preview ? (
              <img src={preview} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span>📷</span>
                <p>Click to upload plant image</p>
              </div>
            )}
          </label>
        </div>
        <button type="submit" disabled={loading || !image}>
          {loading ? 'Analyzing...' : 'Detect Disease'}
        </button>
      </form>
      {prediction && (
        <div className="prediction-result">
          <h3>Disease Detected:</h3>
          <p className="disease-name">{prediction.disease}</p>
          <p className="disease-details">{prediction.details}</p>
          <button onClick={handleAskAI} style={{marginTop: '15px'}}>
            Ask AI for More Details
          </button>
        </div>
      )}
    </div>
  );
};

const AiHome = () => {
  const [showAiChat, setShowAiChat] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [currentView, setCurrentView] = useState('crop');
  const [aiChatMessage, setAiChatMessage] = useState('');
  const navigate = useNavigate();

  const handlePredictionClick = (view) => {
    setCurrentView(view);
    setShowPredictions(false);
    setShowAiChat(false);
  };

  const handleAskAI = (message) => {
    setAiChatMessage(message);
    setShowAiChat(true);
    setCurrentView('');
  };

  const gridItems = [
    { id: 1, title: 'Farm Setup', description: 'Manage your farm infrastructure' },
    { id: 2, title: 'Irrigation Systems', description: 'Control and monitor irrigation' },
    { id: 3, title: 'Storage Facilities', description: 'Track storage and inventory' }
  ];

  return (
    <div className="ai-home-container">
      <header className="ai-home-header">
        <h1>AI Farm Management</h1>
        <div className="header-buttons">
          <div className="prediction-dropdown">
            <button className="ai-chat-btn" onClick={() => setShowPredictions(!showPredictions)}>
              Predictions
            </button>
            {showPredictions && (
              <div className="dropdown-menu">
                <button onClick={() => handlePredictionClick('crop')}>Crop Prediction</button>
                <button onClick={() => handlePredictionClick('disease')}>Disease Prediction</button>
                <button onClick={() => handlePredictionClick('yield')}>Yield Prediction</button>
              </div>
            )}
          </div>
          <button className="ai-chat-btn" onClick={() => setShowAiChat(!showAiChat)}>
            {showAiChat ? 'Close AI Chat' : 'AI Chat'}
          </button>
        </div>
      </header>

      {showAiChat ? (
        <div className="ai-chat-wrapper">
          <AiChat initialMessage={aiChatMessage} />
        </div>
      ) : currentView === 'crop' ? (
        <CropPrediction onAskAI={handleAskAI} />
      ) : currentView === 'disease' ? (
        <DiseasePrediction onAskAI={handleAskAI} />
      ) : currentView === 'yield' ? (
        <YieldPrediction onAskAI={handleAskAI} />
      ) : (
        <div className="grid-container">
          {gridItems.map(item => (
            <div key={item.id} className="grid-item">
              <div className="grid-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiHome;
