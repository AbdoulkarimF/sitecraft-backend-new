require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/mongodb');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/api/test', async (req, res) => {
  try {
    console.log('Test route accessed');
    
    // Check MongoDB connection
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, attempting to connect...');
      await connectDB();
    }
    
    const mongoStatus = {
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
    
    console.log('MongoDB status:', mongoStatus);
    
    res.json({
      message: 'Test route working!',
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus.isConnected ? 'Connected' : 'Disconnected',
      env: process.env.NODE_ENV || 'development',
      mongodbDetails: mongoStatus
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use((req, res) => {
  console.log('404 Not Found:', req.originalUrl);
  res.status(404).json({
    error: true,
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize MongoDB connection
console.log('Initializing server...');
connectDB().then(connection => {
  if (!connection) {
    console.warn('Initial MongoDB connection failed, will retry on requests');
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
  });
});

// Export for Vercel
module.exports = app;
