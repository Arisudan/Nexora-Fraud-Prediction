// FILE: middleware/auth.js
// JWT Authentication Middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Optional authentication - doesn't fail if no token, but populates user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Middleware to check if user has completed KYC
const requireKYC = (req, res, next) => {
  if (!req.user.kycCompleted) {
    return res.status(403).json({
      success: false,
      message: 'KYC verification required to perform this action.'
    });
  }
  next();
};

// Middleware to check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required to perform this action.'
    });
  }
  next();
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireKYC,
  requireVerified,
  requireAdmin,
  generateToken
};
