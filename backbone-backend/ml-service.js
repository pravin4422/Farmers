const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const cropData = {
  'Tamil Nadu': {
    'ARIYALUR': { 'AUTUMN': 'Rice', 'KHARIF': 'Groundnut', 'RABI': 'Rice', 'SUMMER': 'Maize' },
    'CHENNAI': { 'AUTUMN': 'Rice', 'KHARIF': 'Rice', 'RABI': 'Vegetables', 'SUMMER': 'Vegetables' }
  }
};

const diseases = [
  { disease: 'Leaf Blight', details: 'Fungal disease affecting leaves. Treatment: Apply fungicide and remove affected leaves. Prevention: Ensure proper spacing and avoid overhead watering.' },
  { disease: 'Powdery Mildew', details: 'White powdery coating on leaves. Treatment: Apply sulfur-based fungicide. Prevention: Improve air circulation and reduce humidity.' },
  { disease: 'Bacterial Wilt', details: 'Bacterial infection causing wilting. Treatment: Remove infected plants. Prevention: Use disease-free seeds and practice crop rotation.' }
];

app.post('/predict/crop', (req, res) => {
  const { state, district, season } = req.body;
  
  const crop = cropData[state]?.[district]?.[season] || 'Rice';
  
  res.json({ crop });
});

app.post('/predict/yield', (req, res) => {
  const { area } = req.body;
  
  const yieldPerHectare = Math.floor(2000 + Math.random() * 1500);
  const totalYield = yieldPerHectare * parseFloat(area);
  
  res.json({ yield: `${yieldPerHectare} kg/hectare` });
});

app.post('/predict/disease', (req, res) => {
  const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
  res.json(randomDisease);
});

const PORT = process.env.ML_PORT || 5001;
app.listen(PORT, () => {
  console.log(`ML Service running on port ${PORT}`);
});
