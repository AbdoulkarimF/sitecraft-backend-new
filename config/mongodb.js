const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MongoDB connection attempt started');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasMongoURI: !!process.env.MONGODB_URI,
      mongoURILength: process.env.MONGODB_URI?.length
    });

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      ssl: true,
      tls: true,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('MongoDB Connected:', {
      host: conn.connection.host,
      port: conn.connection.port,
      name: conn.connection.name,
      readyState: conn.connection.readyState
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB event: Connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB event: Error', {
        name: err.name,
        message: err.message,
        code: err.code
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB event: Disconnected');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
};

module.exports = connectDB;
