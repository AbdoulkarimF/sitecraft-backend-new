const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

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

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
console.log('Starting MongoDB connection attempt...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasMongoURI: !!process.env.MONGODB_URI,
  hasJWTSecret: !!process.env.JWT_SECRET
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 60000, // Increased timeout to 1 minute
  socketTimeoutMS: 45000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('MongoDB connection successful!');
  console.log('Connection details:', {
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: mongoose.connection.readyState
  });
})
.catch(err => {
  console.error('MongoDB connection error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    codeName: err.codeName,
    stack: err.stack
  });
  
  if (err.name === 'MongoServerSelectionError') {
    console.log('DNS lookup test...');
    const dns = require('dns');
    dns.lookup('cluster0.av9oi.mongodb.net', (err, address, family) => {
      if (err) {
        console.error('DNS lookup failed:', err);
      } else {
        console.log('DNS lookup successful:', { address, family });
      }
    });
  }
});

// Monitor MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection event: connected');
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection event: error', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection event: disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB connection event: reconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('Test route accessed');
  res.json({
    message: 'Test route working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    env: process.env.NODE_ENV || 'development',
    mongodbDetails: {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
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
