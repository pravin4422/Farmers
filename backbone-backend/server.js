const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const creatorRoutes = require('./routes/creatorRoutes'); // ✅ CreatorDetail routes
const productRoutes = require('./routes/products'); // ✅ AgromedicalProducts routes
const tractorRoutes = require('./routes/tractorRoutes'); // ✅ Tractor routes
const kamittyRoutes = require('./routes/kamittyRoutes'); // ✅ Kamitty routes
const priceRoutes = require('./routes/priceRoutes'); // ✅ Prices routes

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
app.use('/api/creator-details', creatorRoutes); 
app.use('/api/products', productRoutes); 
app.use('/api/tractor', tractorRoutes);
app.use('/api/tractors', tractorRoutes);
app.use('/api/kamittys', kamittyRoutes);
app.use('/api/kamitty', kamittyRoutes);

app.use('/api/cultivation-activities', require('./routes/cultivationRoutes'));

// ✅ Add Prices routes
app.use('/api/prices', priceRoutes);

// Test routes
app.get('/', (req, res) => {
  res.send('Backbone backend is running...');
});

app.get('/test', (req, res) => {
  res.send('Server is working');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
