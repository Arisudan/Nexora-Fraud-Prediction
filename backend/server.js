// FILE: server.js
// Main Entry Point - Express Server with MongoDB, WebSocket & Real-time Services

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Import services
const emailService = require('./services/emailService');
const websocketService = require('./services/websocketService');

// Import routes
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting - Prevent brute force and DDoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Sanitize data against NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`🚨 NoSQL Injection attempt blocked on key: ${key}`);
  }
}));

// XSS Protection - Simple sanitizer (xss-clean is deprecated)
app.use((req, res, next) => {
  // Sanitize request body, query, and params
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Don't sanitize password fields
        if (!key.toLowerCase().includes('password')) {
          obj[key] = sanitizeString(obj[key]);
        }
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
});

// HTTPS Enforcement in Production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ==========================================
// CORS CONFIGURATION
// ==========================================

// CORS configuration - Restricted for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Serve static files (for test.html) - Only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(__dirname));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// Trust proxy for IP detection behind reverse proxies
app.set('trust proxy', 1);

// ==========================================
// DATABASE CONNECTION
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora_fraud_predictor';

const connectDB = async () => {
  try {
    const options = {
      // Modern Mongoose 8.x handles connections automatically
      // No need for useNewUrlParser or useUnifiedTopology
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Connect to database
connectDB();

// ==========================================
// API ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Nexora Fraud Predictor API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    websocket: {
      status: 'active',
      connectedUsers: websocketService.getConnectedUsersCount()
    }
  });
});

// API routes - Pass websocket service
app.use('/api', (req, res, next) => {
  req.io = websocketService.getIO();
  req.websocket = websocketService;
  req.emailService = emailService;
  next();
}, apiRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field: ${field}`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ==========================================
// START SERVER WITH REAL-TIME SERVICES
// ==========================================

const PORT = process.env.PORT || 5000;

// Initialize WebSocket
websocketService.initialize(server);

// Initialize Email Service
emailService.initialize().then(ready => {
  if (ready) {
    console.log('📧 Email service initialized');
  }
});

server.listen(PORT, () => {
  console.log('==========================================');
  console.log('🛡️  NEXORA FRAUD PREDICTOR API');
  console.log('   Crowd Intelligence Powered');
  console.log('   ⚡ REAL-TIME ENABLED');
  console.log('==========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('==========================================');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    console.log('Process terminated');
    await mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(async () => {
    console.log('Process terminated');
    await mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app;
