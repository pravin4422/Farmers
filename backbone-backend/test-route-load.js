// Quick test to verify crop recommendation route is loaded
const express = require('express');

try {
  const cropRecommendationRoutes = require('./routes/cropRecommendationRoutes');
  console.log('✅ Crop recommendation routes loaded successfully');
  console.log('Routes:', cropRecommendationRoutes.stack ? cropRecommendationRoutes.stack.map(r => r.route.path) : 'Router loaded');
} catch (error) {
  console.error('❌ Error loading crop recommendation routes:', error.message);
}

try {
  const controller = require('./controllers/cropRecommendationController');
  console.log('✅ Crop recommendation controller loaded successfully');
  console.log('Exports:', Object.keys(controller));
} catch (error) {
  console.error('❌ Error loading crop recommendation controller:', error.message);
}
