const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://sitecraft.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set (length: ' + process.env.MONGODB_URI.length + ')' : 'Not set');
    console.log('Environment:', process.env.NODE_ENV);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB URI:', process.env.MONGODB_URI ? 'Set (length: ' + process.env.MONGODB_URI.length + ')' : 'Not set');
    console.error('Environment:', process.env.NODE_ENV);
  });

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to SiteCraft API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: [
        { path: '/api/auth/register', method: 'POST', description: 'Register a new user' },
        { path: '/api/auth/login', method: 'POST', description: 'Login user' },
        { path: '/api/auth/me', method: 'GET', description: 'Get current user info' }
      ]
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    env: {
      nodeEnv: process.env.NODE_ENV,
      mongoDbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

// Start server if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// Export for Vercel
module.exports = app;
