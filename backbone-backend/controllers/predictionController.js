const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const YIELD_ML_SERVICE_URL = 'http://127.0.0.1:5002';

exports.predictCrop = async (req, res) => {
  try {
    const { state, district, season, year, area } = req.body;

    if (!state || !district || !season || !year || !area) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const response = await axios.post(`${ML_SERVICE_URL}/predict/crop`, {
      state,
      district,
      season,
      year: parseInt(year),
      area: parseFloat(area)
    });

    res.json({ crop: response.data.crop });
  } catch (error) {
    console.error('Crop prediction error:', error.message);
    res.status(500).json({ error: 'Prediction service unavailable' });
  }
};

exports.predictYield = async (req, res) => {
  try {
    const { crop, crop_year, season, state, area, annual_rainfall } = req.body;

    if (!crop || !crop_year || !season || !state || !area || !annual_rainfall) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const response = await axios.post(`${YIELD_ML_SERVICE_URL}/predict_yield`, {
      crop,
      crop_year: parseInt(crop_year),
      season,
      state,
      area: parseFloat(area),
      annual_rainfall: parseFloat(annual_rainfall)
    });

    res.json(response.data);
  } catch (error) {
    console.error('Yield prediction error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || 'Prediction service unavailable' });
  }
};

exports.predictDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, req.file.originalname);

    const response = await axios.post(`${ML_SERVICE_URL}/predict/disease`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Disease prediction error:', error.message);
    res.status(500).json({ error: 'Prediction service unavailable' });
  }
};
