const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register route hit');
    console.log('Request body:', req.body);
    
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: true,
        message: 'All fields are required' 
      });
    }

    // Check if user already exists
    console.log('Checking for existing user');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({ 
        error: true,
        message: 'User already exists' 
      });
    }

    // Create new user
    console.log('Creating new user');
    const user = new User({
      email,
      password, // Will be hashed by the pre-save middleware
      name
    });

    console.log('Saving user to database');
    await user.save();
    console.log('User saved successfully');

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Sending success response');
    return res.status(201).json({
      error: false,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error in register route:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      details: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: true,
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: true,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: true,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      error: false,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error in login route:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      details: error.message
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: true,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: true,
        message: 'User not found' 
      });
    }

    return res.json({
      error: false,
      user
    });
  } catch (error) {
    console.error('Error in get user route:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
