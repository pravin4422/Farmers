const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const creatorRoutes = require('./routes/creatorRoutes'); // ✅ Added CreatorDetail routes
const productRoutes = require('./routes/products'); // ✅ Added AgromedicalProducts routes

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/creator-details', creatorRoutes); // ✅ Added CreatorDetail routes
app.use('/api/products', productRoutes); // ✅ Added AgromedicalProducts routes

// Test route
app.get('/', (req, res) => {
  res.send('Backbone backend is running...');
});

// Only for testing purpose
app.get('/test', (req, res) => {
  res.send('Server is working');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
