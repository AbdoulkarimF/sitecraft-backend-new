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

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', req.body);
  
  // Capture the original send
  const originalSend = res.send;
  res.send = function(data) {
    console.log('Response:', data);
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Connect to MongoDB
console.log('Initializing server...');
connectDB();

// Test route
app.get('/api/test', async (req, res) => {
  console.log('Test route accessed');
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
    headers: req.headers,
    mongodb: mongoStatus.isConnected ? 'Connected' : 'Disconnected',
    env: process.env.NODE_ENV || 'development',
    mongodbDetails: mongoStatus
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
});

// Export for Vercel
module.exports = app;
