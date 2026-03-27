const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const creatorRoutes = require('./routes/creatorRoutes'); // ✅ CreatorDetail routes
const productRoutes = require('./routes/products'); // ✅ AgromedicalProducts routes
const tractorRoutes = require('./routes/tractorRoutes'); // ✅ Tractor routes
const kamittyRoutes = require('./routes/kamittyRoutes'); // ✅ Mandi routes
const priceRoutes = require('./routes/priceRoutes'); // ✅ Prices routes
const priceAnalysisRoutes = require('./routes/priceAnalysisRoutes'); // ✅ AI Price Analysis routes
const postRoutes = require('./routes/posts');
const commonForumRoutes = require('./routes/commonForumRoutes');
// ✅ Add Reminder/Task routes
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notificationRoutes'); // ✅ Notification routes
const userProfileRoutes = require('./routes/userProfileRoutes');
const expiryRoutes = require('./routes/expiryRoutes'); // ✅ Expiry routes
const problemRoutes = require('./routes/problemRoutes'); // ✅ Problem routes
const libraryRoutes = require('./routes/libraryRoutes'); // ✅ Library routes
const predictionRoutes = require('./routes/predictionRoutes'); // ✅ Prediction routes
const validatorTestRoutes = require('./routes/validatorTest'); // ✅ Validator test routes
const schemeRoutes = require('./routes/schemeRoutes'); // ✅ Scheme routes
const chatbotRoutes = require('./routes/chatbotRoutes'); // ✅ Chatbot routes
const cropRecommendationRoutes = require('./routes/cropRecommendationRoutes'); // ✅ Crop recommendation routes
const adminRoutes = require('./routes/adminRoutes'); // ✅ Admin routes

const adminRoutes = require('./routes/adminRoutes'); // ✅ Admin routes

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static audio files
app.use('/audio', express.static('public/audio'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/creator-details', creatorRoutes); 
app.use('/api/products', productRoutes); 
app.use('/api/tractor', tractorRoutes);
app.use('/api/tractors', tractorRoutes);
app.use('/api/kamittys', kamittyRoutes);
app.use('/api/kamitty', kamittyRoutes);

app.use('/api/cultivation-activities', require('./routes/cultivationRoutes'));

// ✅ Add Prices routes
app.use('/api/prices', priceRoutes);
app.use('/api/price-analysis', priceAnalysisRoutes); // ✅ AI Price Analysis routes

// ✅ Add Reminder/Task routes
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes); // ✅ Notification routes
app.use('/api/posts', postRoutes);
app.use('/api/common-forum', commonForumRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/expiries', expiryRoutes); // ✅ Expiry routes
app.use('/api/problems', problemRoutes); // ✅ Problem routes
app.use('/api/library', libraryRoutes); // ✅ Library routes
app.use('/api/predict', predictionRoutes); // ✅ Prediction routes
app.use('/api/validator', validatorTestRoutes); // ✅ Validator test routes
app.use('/api/schemes', schemeRoutes); // ✅ Scheme routes
app.use('/api/chatbot', chatbotRoutes); // ✅ Chatbot routes
app.use('/api/crop-recommendation', cropRecommendationRoutes); // ✅ Crop recommendation routes
app.use('/api/admin', adminRoutes); // ✅ Admin routes


// Test routes
app.get('/', (req, res) => {
  res.send('Backbone backend is running...');
});

app.get('/test', (req, res) => {
  res.send('Server is working');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  
  // Start notification scheduler
  const { startReminderScheduler } = require('./services/notificationService');
  startReminderScheduler();
  console.log('✅ Notification scheduler started');
  
  // Start price auto-save scheduler
  const { startPriceAutoSaveScheduler } = require('./services/priceAutoSaveService');
  startPriceAutoSaveScheduler();
  console.log('✅ Price auto-save scheduler started');
});
