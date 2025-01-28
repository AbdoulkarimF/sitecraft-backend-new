const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('MongoDB connection attempt started');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasMongoURI: true,
      mongoURILength: process.env.MONGODB_URI.length
    });

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('MongoDB Connected:', {
      host: conn.connection.host,
      name: conn.connection.name,
      readyState: conn.connection.readyState
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Don't exit the process, just return null to indicate failure
    return null;
  }
};

module.exports = connectDB;
