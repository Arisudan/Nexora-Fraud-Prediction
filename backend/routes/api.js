// FILE: routes/api.js
// API Routes for Authentication, Fraud Reporting, and Risk Checking
// ⚡ Real-time enabled with WebSocket and Email OTP

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const crypto = require('crypto');

const User = require('../models/User');
const FraudReport = require('../models/FraudReport');
const ActivityLog = require('../models/ActivityLog');
const BlacklistedToken = require('../models/BlacklistedToken');
const { 
  authenticateToken, 
  optionalAuth,
  requireKYC,
  generateToken 
} = require('../middleware/auth');

// Import real-time services
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const websocketService = require('../services/websocketService');

// ==========================================
// PASSWORD STRENGTH VALIDATOR
// ==========================================
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }
  
  return errors;
};

// ==========================================
// CONTENT-BASED FRAUD DETECTION (NLP)
// Analyze SMS/Email content for fraud patterns
// ==========================================

const FRAUD_KEYWORDS = {
  urgency: [
    'urgent', 'immediately', 'now', 'asap', 'hurry', 'quickly', 'fast',
    'limited time', 'act now', 'don\'t delay', 'last chance', 'expires today',
    'deadline', '24 hours', 'within hours'
  ],
  financial: [
    'bank account', 'credit card', 'debit card', 'atm', 'pin', 'cvv', 'otp',
    'transfer', 'transaction', 'payment', 'loan', 'emi', 'upi', 'neft', 'rtgs',
    'blocked', 'suspended', 'verify account', 'update kyc', 'kyc expired',
    'prize', 'lottery', 'jackpot', 'won', 'winner', 'reward', 'cash prize',
    'refund', 'cashback', 'bonus'
  ],
  threats: [
    'account blocked', 'account suspended', 'will be blocked', 'will be suspended',
    'legal action', 'police', 'arrest', 'case filed', 'complaint', 'court',
    'fine', 'penalty', 'closure', 'terminate', 'deactivate', 'seized'
  ],
  impersonation: [
    'customer care', 'customer support', 'helpline', 'helpdesk',
    'rbi', 'reserve bank', 'income tax', 'it department', 'government',
    'sbi', 'hdfc', 'icici', 'axis', 'bank manager', 'bank officer',
    'amazon', 'flipkart', 'paytm', 'phonepe', 'gpay', 'google pay'
  ],
  action_requests: [
    'click here', 'click link', 'tap here', 'click below', 'visit',
    'call this number', 'call us', 'dial', 'contact immediately',
    'share otp', 'share pin', 'provide details', 'verify yourself',
    'confirm identity', 'update details', 'fill form', 'download app',
    'install', 'remote access', 'anydesk', 'teamviewer'
  ],
  suspicious_patterns: [
    'dear customer', 'dear user', 'dear valued', 'respected sir',
    'confidential', 'do not share', 'keep secret',
    'free gift', 'free offer', 'get free', '100% free',
    'guaranteed', 'no risk', 'risk free'
  ]
};

const analyzeContentForFraud = (content) => {
  if (!content || typeof content !== 'string') {
    return { isSuspicious: false, score: 0, findings: [] };
  }
  
  const lowerContent = content.toLowerCase();
  const findings = [];
  let score = 0;
  
  // Check each category
  for (const [category, keywords] of Object.entries(FRAUD_KEYWORDS)) {
    const matchedKeywords = keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      const categoryScore = matchedKeywords.length * getCategoryWeight(category);
      score += categoryScore;
      findings.push({
        category,
        matchedKeywords,
        score: categoryScore
      });
    }
  }
  
  // Check for suspicious URL patterns
  const urlPatterns = [
    /bit\.ly/gi, /tinyurl/gi, /goo\.gl/gi, /ow\.ly/gi, /t\.co/gi,
    /shorturl/gi, /tiny\.cc/gi, /is\.gd/gi, /v\.gd/gi,
    /http[s]?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/gi // IP-based URLs
  ];
  
  for (const pattern of urlPatterns) {
    if (pattern.test(content)) {
      score += 3;
      findings.push({
        category: 'suspicious_url',
        matchedKeywords: ['shortened/suspicious URL detected'],
        score: 3
      });
      break;
    }
  }
  
  // Check for excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    score += 2;
    findings.push({
      category: 'excessive_caps',
      matchedKeywords: ['Excessive use of capital letters'],
      score: 2
    });
  }
  
  // Determine risk level
  let riskLevel, riskMessage;
  if (score === 0) {
    riskLevel = 'safe';
    riskMessage = 'No suspicious patterns detected in content.';
  } else if (score <= 5) {
    riskLevel = 'low';
    riskMessage = 'Some potentially suspicious patterns detected. Be cautious.';
  } else if (score <= 10) {
    riskLevel = 'suspicious';
    riskMessage = 'Multiple fraud indicators found. Exercise caution!';
  } else {
    riskLevel = 'high_risk';
    riskMessage = 'HIGH RISK - Multiple fraud patterns detected! Likely a scam.';
  }
  
  return {
    isSuspicious: score > 0,
    score,
    riskLevel,
    riskMessage,
    findings,
    analyzedAt: new Date()
  };
};

const getCategoryWeight = (category) => {
  const weights = {
    urgency: 1,
    financial: 2,
    threats: 3,
    impersonation: 3,
    action_requests: 2,
    suspicious_patterns: 1
  };
  return weights[category] || 1;
};

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ==========================================
// CROWD INTELLIGENCE ALGORITHM
// Core fraud risk calculation function
// ==========================================

// Helper function to normalize entities for consistent querying
const normalizeEntity = (entity) => {
  let normalized = entity.toLowerCase().trim();
  
  // Check if it's an email (contains @)
  if (normalized.includes('@')) {
    // For emails, just lowercase and trim - keep all characters
    return normalized;
  }
  
  // Check if it's a UPI ID (contains @ but no dot after @, like name@ybl)
  // Already handled above since it has @
  
  // For phone numbers: Remove common formatting: (), -, spaces, +
  // This converts "(763) 274-3899" to "7632743899"
  normalized = normalized.replace(/[\s\-\(\)\+\.]/g, '');
  
  return normalized;
};

const calculateFraudRisk = async (targetEntity) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Normalize the input (strip formatting from phone numbers)
  const normalizedEntity = normalizeEntity(targetEntity);
  
  console.log('\n========== RISK CHECK ==========');
  console.log('Original input:', targetEntity);
  console.log('Normalized entity:', normalizedEntity);
  console.log('Date range: from', thirtyDaysAgo, 'to now');
  
  // Query all reports for this entity in the last 30 days
  const reports = await FraudReport.find({
    targetEntity: normalizedEntity,
    timestamp: { $gte: thirtyDaysAgo },
    isActive: true
  });
  
  console.log('Found reports:', reports.length);
  if (reports.length > 0) {
    console.log('Report details:', reports.map(r => ({ entity: r.targetEntity, category: r.category, date: r.timestamp })));
  }
  
  let score = 0;
  const reportDetails = [];
  
  // Calculate score based on the Crowd Intelligence Logic
  for (const report of reports) {
    // Base: +1 point for every report in the last 30 days
    let reportScore = 1;
    
    // +2 additional points if category is "Phishing" or "Identity Theft"
    if (report.category === 'Phishing' || report.category === 'Identity Theft') {
      reportScore += 2;
    }
    
    score += reportScore;
    
    reportDetails.push({
      id: report._id,
      category: report.category,
      timestamp: report.timestamp,
      pointsAdded: reportScore
    });
  }
  
  // Determine risk level based on score
  let riskLevel, riskColor, riskMessage;
  
  if (score === 0) {
    riskLevel = 'safe';
    riskColor = 'green';
    riskMessage = 'No fraud reports found. This entity appears safe.';
  } else if (score >= 1 && score <= 5) {
    riskLevel = 'suspicious';
    riskColor = 'yellow';
    riskMessage = 'Some suspicious activity detected. Proceed with caution.';
  } else {
    riskLevel = 'high_risk';
    riskColor = 'red';
    riskMessage = 'HIGH RISK / UNSAFE - Multiple fraud reports detected! Exercise extreme caution.';
  }
  
  return {
    targetEntity: targetEntity.toLowerCase().trim(),
    score,
    riskLevel,
    riskColor,
    riskMessage,
    totalReports: reports.length,
    reportDetails,
    checkedAt: new Date()
  };
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/register - User Registration with Password Strength & Email Verification
router.post('/auth/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('protectionSettings').optional().isObject()
], validate, async (req, res) => {
  try {
    const { name, email, password, phone, protectionSettings } = req.body;
    
    // Strong password validation
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordErrors
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }
    
    // Build protection settings from registration
    const userProtectionSettings = {
      callProtection: {
        enabled: protectionSettings?.callProtection?.enabled || false,
        registeredPhone: (protectionSettings?.callProtection?.phone || phone || '').replace(/[\s\-\(\)\+\.]/g, ''),
        alertMode: 'popup',
        activatedAt: protectionSettings?.callProtection?.enabled ? new Date() : null
      },
      smsProtection: {
        enabled: protectionSettings?.smsProtection?.enabled || false,
        registeredPhone: (protectionSettings?.smsProtection?.phone || phone || '').replace(/[\s\-\(\)\+\.]/g, ''),
        alertMode: 'popup',
        activatedAt: protectionSettings?.smsProtection?.enabled ? new Date() : null
      },
      emailProtection: {
        enabled: protectionSettings?.emailProtection?.enabled || false,
        registeredEmail: (protectionSettings?.emailProtection?.email || email || '').toLowerCase().trim(),
        alertMode: 'popup',
        activatedAt: protectionSettings?.emailProtection?.enabled ? new Date() : null
      }
    };
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone: phone?.replace(/[\s\-\(\)\+\.]/g, ''),
      protectionSettings: userProtectionSettings,
      isEmailVerified: false
    });
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Log activity
    await ActivityLog.logActivity({
      userId: user._id,
      actionType: 'register',
      details: { email: user.email },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send email verification
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    emailService.sendEmailVerification(user.email, user.name, verificationUrl)
      .then(() => console.log(`📧 Verification email sent to ${user.email}`))
      .catch(err => console.error(`Failed to send verification email: ${err.message}`));

    // ⚡ REAL-TIME: Send welcome email with protection status
    const enabledProtections = [];
    if (userProtectionSettings.callProtection.enabled) enabledProtections.push('Call Protection');
    if (userProtectionSettings.smsProtection.enabled) enabledProtections.push('SMS Protection');
    if (userProtectionSettings.emailProtection.enabled) enabledProtections.push('Email Protection');
    
    emailService.sendWelcome(user.email, user.name, enabledProtections)
      .then(() => console.log(`📧 Welcome email sent to ${user.email}`))
      .catch(err => console.error(`Failed to send welcome email: ${err.message}`));
    
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        user: user.getPublicProfile(),
        token,
        emailVerificationRequired: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration. Please try again.'
    });
  }
});

// POST /api/auth/verify-email - Verify email address
router.post('/auth/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], validate, async (req, res) => {
  try {
    const { token } = req.body;
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this token and not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please request a new one.'
      });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: user._id,
      actionType: 'email_verified',
      details: { email: user.email },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email. Please try again.'
    });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/auth/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link will be sent.'
      });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified.'
      });
    }
    
    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await emailService.sendEmailVerification(user.email, user.name, verificationUrl);
    
    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email. Please try again.'
    });
  }
});

// POST /api/auth/login - User Login with Account Lockout Protection
router.post('/auth/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password and lockout fields
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      
      // Log failed attempt
      await ActivityLog.logActivity({
        userId: user._id,
        actionType: 'login',
        details: { email: user.email, reason: 'account_locked' },
        result: 'blocked',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed attempts. Please try again in ${minutesLeft} minute(s).`,
        lockedUntil: user.lockUntil
      });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      
      // Log failed attempt
      await ActivityLog.logActivity({
        userId: user._id,
        actionType: 'login',
        details: { email: user.email, reason: 'invalid_password' },
        result: 'failed',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      if (attemptsLeft > 0) {
        return res.status(401).json({
          success: false,
          message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Account has been locked for 30 minutes.'
        });
      }
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Log activity
    await ActivityLog.logActivity({
      userId: user._id,
      actionType: 'login',
      details: { email: user.email },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: user.getPublicProfile(),
        token,
        emailVerificationRequired: !user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.'
    });
  }
});

// POST /api/auth/logout - Secure logout with token blacklisting
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Decode token to get expiry
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Blacklist the token
      await BlacklistedToken.blacklistToken(token, req.user._id, expiresAt, 'logout');
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'logout',
      details: { email: req.user.email },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout.'
    });
  }
});

// ==========================================
// FORGOT PASSWORD ROUTES
// ==========================================

// Store OTPs temporarily (in production, use Redis or database)
const resetOTPs = new Map();

// POST /api/auth/forgot-password - Request password reset OTP
router.post('/auth/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (15 minutes)
    resetOTPs.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      verified: false
    });
    
    // In production, send email here
    // For demo, log to console
    console.log('\n========================================');
    console.log('🔐 PASSWORD RESET OTP');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log('(Valid for 15 minutes)');
    console.log('========================================\n');
    
    res.json({
      success: true,
      message: 'Reset code sent to your email.',
      // For demo only - remove in production:
      demo_otp: otp
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset code. Please try again.'
    });
  }
});

// POST /api/auth/verify-reset-otp - Verify reset OTP
router.post('/auth/verify-reset-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
], validate, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const storedData = resetOTPs.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No reset request found. Please request a new code.'
      });
    }
    
    if (Date.now() > storedData.expiresAt) {
      resetOTPs.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Please try again.'
      });
    }
    
    // Mark as verified
    storedData.verified = true;
    resetOTPs.set(email.toLowerCase(), storedData);
    
    res.json({
      success: true,
      message: 'Code verified successfully.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying code. Please try again.'
    });
  }
});

// POST /api/auth/reset-password - Reset password with verified OTP
router.post('/auth/reset-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], validate, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const storedData = resetOTPs.get(email.toLowerCase());
    
    if (!storedData || !storedData.verified || storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unverified reset request. Please start over.'
      });
    }
    
    if (Date.now() > storedData.expiresAt) {
      resetOTPs.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }
    
    // Find and update user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
    
    // Remove used OTP
    resetOTPs.delete(email.toLowerCase());
    
    // Log activity
    await ActivityLog.logActivity({
      userId: user._id,
      actionType: 'password_reset',
      details: { email: user.email },
      result: 'success'
    });
    
    console.log(`✅ Password reset successful for: ${email}`);
    
    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password. Please try again.'
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile.'
    });
  }
});

// ==========================================
// KYC ROUTES
// ==========================================

// POST /api/kyc/submit - Submit KYC information
router.post('/kyc/submit', authenticateToken, [
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits)'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('idNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('ID number must be between 5 and 50 characters')
], validate, async (req, res) => {
  try {
    const { phone, address, idNumber } = req.body;
    
    // Update user with KYC details
    req.user.phone = phone;
    req.user.kycDetails = {
      phone,
      address: address || '',
      idNumber: idNumber || '',
      verifiedAt: null
    };
    
    await req.user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'kyc_submit',
      details: { phone },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'KYC information submitted. Please verify your phone number.',
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('KYC submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting KYC information.'
    });
  }
});

// POST /api/kyc/verify-otp - Verify OTP (REAL Implementation)
router.post('/kyc/verify-otp', authenticateToken, [
  body('otp')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits')
], validate, async (req, res) => {
  try {
    const { otp } = req.body;
    
    // Verify OTP using real OTP service
    const verifyResult = otpService.verify(req.user.email, otp, 'kyc');
    
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        error: verifyResult.error,
        remainingAttempts: verifyResult.remainingAttempts
      });
    }
    
    // Update user verification status
    req.user.isVerified = true;
    req.user.kycCompleted = true;
    req.user.kycDetails.verifiedAt = new Date();
    
    await req.user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'otp_verify',
      details: { verified: true },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send real-time notification
    websocketService.sendNotification(req.user._id.toString(), {
      type: 'verification_success',
      title: 'Verification Complete',
      message: 'Your account has been verified successfully!'
    });
    
    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP.'
    });
  }
});

// POST /api/kyc/send-otp - Send OTP (REAL Implementation with Email)
router.post('/kyc/send-otp', authenticateToken, async (req, res) => {
  try {
    // Generate real OTP
    const otpResult = otpService.generate(req.user.email, 'kyc');
    
    if (!otpResult.success) {
      return res.status(429).json({
        success: false,
        message: otpResult.message,
        waitSeconds: otpResult.waitSeconds
      });
    }
    
    // Send OTP via email (real-time)
    const emailResult = await emailService.sendOTP(
      req.user.email, 
      otpResult.otp, 
      req.user.name
    );
    
    if (!emailResult.success) {
      // Invalidate OTP if email failed
      otpService.invalidate(req.user.email, 'kyc');
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'otp_sent',
      details: { email: req.user.email },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send real-time notification
    websocketService.sendOTPNotification(req.user._id.toString(), {
      message: 'OTP sent to your email',
      expiresInMinutes: otpResult.expiresInMinutes
    });
    
    res.json({
      success: true,
      message: `OTP sent successfully to ${req.user.email}`,
      data: {
        expiresInMinutes: otpResult.expiresInMinutes,
        email: req.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP.'
    });
  }
});

// ==========================================
// FRAUD REPORT ROUTES
// ==========================================

// POST /api/fraud/report - Submit a fraud report
router.post('/fraud/report', authenticateToken, [
  body('targetEntity')
    .trim()
    .notEmpty()
    .withMessage('Target entity (phone/email/UPI) is required'),
  body('entityType')
    .isIn(['phone', 'email', 'upi'])
    .withMessage('Entity type must be one of: phone, email, upi'),
  body('category')
    .isIn([
      'Phishing', 'Identity Theft', 'Financial Fraud', 'Spam',
      'Harassment', 'Fake Lottery', 'Investment Scam', 'Romance Scam',
      'Tech Support Scam', 'Other'
    ])
    .withMessage('Invalid category'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('evidence')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Evidence text cannot exceed 5000 characters'),
  body('amountLost')
    .optional()
    .isNumeric()
    .withMessage('Amount lost must be a number')
], validate, async (req, res) => {
  try {
    const { 
      targetEntity, 
      entityType, 
      category, 
      description, 
      evidence,
      amountLost,
      incidentDate 
    } = req.body;
    
    const normalizedEntity = targetEntity.toLowerCase().trim();
    
    console.log('\n========== NEW FRAUD REPORT ==========');
    console.log('Target Entity:', normalizedEntity);
    console.log('Entity Type:', entityType);
    console.log('Category:', category);
    console.log('Reporter ID:', req.user._id);
    
    // Create fraud report
    const report = new FraudReport({
      reporterId: req.user._id,
      targetEntity: normalizedEntity,
      entityType,
      category,
      description,
      evidence: evidence || '',
      amountLost: amountLost || 0,
      incidentDate: incidentDate ? new Date(incidentDate) : null,
      timestamp: new Date(),
      isActive: true
    });
    
    await report.save();
    console.log('Report saved successfully! ID:', report._id);
    console.log('==========================================\n');
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'report_fraud',
      targetEntity: targetEntity.toLowerCase().trim(),
      entityType,
      details: { 
        category, 
        reportId: report._id 
      },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Fraud report submitted successfully. Thank you for helping protect the community!',
      data: {
        report: report.getSummary()
      }
    });
  } catch (error) {
    console.error('Report fraud error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting fraud report.'
    });
  }
});

// GET /api/fraud/my-reports - Get user's submitted reports
router.get('/fraud/my-reports', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reports = await FraudReport.find({ reporterId: req.user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await FraudReport.countDocuments({ reporterId: req.user._id });
    
    res.json({
      success: true,
      data: {
        reports: reports.map(r => r.getSummary()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports.'
    });
  }
});

// ==========================================
// RISK CHECK ROUTES (CROWD INTELLIGENCE)
// ==========================================

// POST /api/check-risk - Check fraud risk for an entity
router.post('/check-risk', optionalAuth, [
  body('entity')
    .trim()
    .notEmpty()
    .withMessage('Entity (phone/email/UPI) is required'),
  body('entityType')
    .optional()
    .isIn(['phone', 'email', 'upi'])
    .withMessage('Entity type must be one of: phone, email, upi')
], validate, async (req, res) => {
  try {
    const { entity, entityType } = req.body;
    
    // Run the Crowd Intelligence Algorithm
    const riskResult = await calculateFraudRisk(entity);
    
    // Log the search/check activity
    await ActivityLog.logActivity({
      userId: req.userId || null,
      actionType: 'check_risk',
      targetEntity: entity.toLowerCase().trim(),
      entityType: entityType || 'none',
      details: { 
        score: riskResult.score,
        totalReports: riskResult.totalReports 
      },
      result: 'success',
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.score,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Risk check completed.',
      data: riskResult
    });
  } catch (error) {
    console.error('Check risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking fraud risk.'
    });
  }
});

// GET /api/check-risk/:entity - Alternative GET endpoint
router.get('/check-risk/:entity', optionalAuth, async (req, res) => {
  try {
    const { entity } = req.params;
    
    // Run the Crowd Intelligence Algorithm
    const riskResult = await calculateFraudRisk(entity);
    
    // Log the search/check activity
    await ActivityLog.logActivity({
      userId: req.userId || null,
      actionType: 'check_risk',
      targetEntity: entity.toLowerCase().trim(),
      details: { 
        score: riskResult.score,
        totalReports: riskResult.totalReports 
      },
      result: 'success',
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.score,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Risk check completed.',
      data: riskResult
    });
  } catch (error) {
    console.error('Check risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking fraud risk.'
    });
  }
});

// ==========================================
// CONTENT-BASED FRAUD ANALYSIS ROUTES
// ==========================================

// POST /api/analyze-content - Analyze SMS/Email content for fraud patterns
router.post('/analyze-content', optionalAuth, [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required for analysis'),
  body('contentType')
    .optional()
    .isIn(['sms', 'email', 'message'])
    .withMessage('Content type must be one of: sms, email, message')
], validate, async (req, res) => {
  try {
    const { content, contentType, senderEntity } = req.body;
    
    // Analyze content for fraud patterns
    const contentAnalysis = analyzeContentForFraud(content);
    
    // If sender entity provided, also check entity risk
    let entityRisk = null;
    if (senderEntity) {
      entityRisk = await calculateFraudRisk(senderEntity);
    }
    
    // Combine scores if both analyses available
    let combinedRiskLevel = contentAnalysis.riskLevel;
    let combinedScore = contentAnalysis.score;
    
    if (entityRisk) {
      combinedScore += entityRisk.score;
      if (entityRisk.riskLevel === 'high_risk' || contentAnalysis.riskLevel === 'high_risk') {
        combinedRiskLevel = 'high_risk';
      } else if (entityRisk.riskLevel === 'suspicious' || contentAnalysis.riskLevel === 'suspicious') {
        combinedRiskLevel = 'suspicious';
      }
    }
    
    // Log the analysis
    await ActivityLog.logActivity({
      userId: req.userId || null,
      actionType: 'analyze_content',
      targetEntity: senderEntity || 'unknown',
      entityType: contentType || 'message',
      details: { 
        contentLength: content.length,
        contentScore: contentAnalysis.score,
        entityScore: entityRisk?.score || 0,
        combinedScore
      },
      result: 'success',
      riskLevel: combinedRiskLevel,
      riskScore: combinedScore,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Content analysis completed.',
      data: {
        contentAnalysis,
        entityRisk,
        combinedRisk: {
          score: combinedScore,
          riskLevel: combinedRiskLevel,
          message: combinedRiskLevel === 'high_risk' 
            ? '🚨 HIGH RISK - This message contains multiple fraud indicators!'
            : combinedRiskLevel === 'suspicious'
            ? '⚠️ CAUTION - Suspicious patterns detected. Be careful!'
            : combinedRiskLevel === 'low'
            ? '⚡ Low risk - Some patterns detected, but proceed with caution.'
            : '✅ Content appears safe.'
        },
        analyzedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing content.'
    });
  }
});

// ==========================================
// PROTECTION SETTINGS ROUTES
// ==========================================

// POST /api/settings/protection - Update protection settings
router.post('/settings/protection', authenticateToken, [
  body('callProtection').optional().isObject(),
  body('smsProtection').optional().isObject(),
  body('emailProtection').optional().isObject()
], validate, async (req, res) => {
  try {
    const { callProtection, smsProtection, emailProtection } = req.body;
    
    // Initialize protection settings if not exists
    if (!req.user.protectionSettings) {
      req.user.protectionSettings = {};
    }
    
    // Update call protection
    if (callProtection !== undefined) {
      req.user.protectionSettings.callProtection = {
        ...req.user.protectionSettings.callProtection,
        enabled: callProtection.enabled || false,
        registeredPhone: callProtection.registeredPhone?.replace(/[\s\-\(\)\+\.]/g, '') || '',
        alertMode: callProtection.alertMode || 'popup',
        activatedAt: callProtection.enabled ? new Date() : null
      };
    }
    
    // Update SMS protection
    if (smsProtection !== undefined) {
      req.user.protectionSettings.smsProtection = {
        ...req.user.protectionSettings.smsProtection,
        enabled: smsProtection.enabled || false,
        registeredPhone: smsProtection.registeredPhone?.replace(/[\s\-\(\)\+\.]/g, '') || '',
        alertMode: smsProtection.alertMode || 'popup',
        activatedAt: smsProtection.enabled ? new Date() : null
      };
    }
    
    // Update email protection
    if (emailProtection !== undefined) {
      req.user.protectionSettings.emailProtection = {
        ...req.user.protectionSettings.emailProtection,
        enabled: emailProtection.enabled || false,
        registeredEmail: emailProtection.registeredEmail?.toLowerCase().trim() || '',
        alertMode: emailProtection.alertMode || 'popup',
        activatedAt: emailProtection.enabled ? new Date() : null
      };
    }
    
    await req.user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'update_protection',
      details: { settings: req.user.protectionSettings },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Protection settings updated successfully.',
      data: {
        protectionSettings: req.user.protectionSettings,
        enabledProtections: req.user.getEnabledProtections()
      }
    });
  } catch (error) {
    console.error('Update protection settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating protection settings.'
    });
  }
});

// GET /api/settings/protection - Get current protection settings
router.get('/settings/protection', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        protectionSettings: req.user.protectionSettings || {},
        enabledProtections: req.user.getEnabledProtections ? req.user.getEnabledProtections() : []
      }
    });
  } catch (error) {
    console.error('Get protection settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching protection settings.'
    });
  }
});

// ==========================================
// REAL-TIME ALERTS ROUTES
// ==========================================

// GET /api/alerts/pending - Get pending alerts for user
router.get('/alerts/pending', authenticateToken, async (req, res) => {
  try {
    const pendingAlerts = req.user.pendingAlerts?.filter(a => !a.acknowledged) || [];
    
    res.json({
      success: true,
      data: {
        alerts: pendingAlerts,
        count: pendingAlerts.length
      }
    });
  } catch (error) {
    console.error('Get pending alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts.'
    });
  }
});

// POST /api/alerts/acknowledge/:alertId - Acknowledge an alert
router.post('/alerts/acknowledge/:alertId', authenticateToken, [
  body('action')
    .optional()
    .isIn(['blocked', 'allowed', 'reported', 'dismissed'])
    .withMessage('Action must be one of: blocked, allowed, reported, dismissed')
], validate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { action } = req.body;
    
    const alert = req.user.pendingAlerts?.id(alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found.'
      });
    }
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    
    // Add to history
    req.user.alertHistory.push({
      alertType: alert.alertType,
      fromEntity: alert.fromEntity,
      riskLevel: alert.riskLevel,
      riskScore: alert.riskScore,
      action: action || 'dismissed',
      timestamp: new Date()
    });
    
    // Keep only last 500 history items
    if (req.user.alertHistory.length > 500) {
      req.user.alertHistory = req.user.alertHistory.slice(-500);
    }
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Alert acknowledged.',
      data: { alertId, action }
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert.'
    });
  }
});

// POST /api/alerts/trigger - Trigger an alert (simulates incoming call/sms/email)
router.post('/alerts/trigger', [
  body('recipientPhone').optional().trim(),
  body('recipientEmail').optional().trim(),
  body('fromEntity').trim().notEmpty().withMessage('From entity is required'),
  body('alertType')
    .isIn(['call', 'sms', 'email', 'upi'])
    .withMessage('Alert type must be one of: call, sms, email, upi')
], validate, async (req, res) => {
  try {
    const { recipientPhone, recipientEmail, fromEntity, alertType, message } = req.body;
    
    // Find users with this protection enabled
    let users = [];
    
    if (alertType === 'call' && recipientPhone) {
      users = await User.findByProtectedEntity(recipientPhone, 'call');
    } else if (alertType === 'sms' && recipientPhone) {
      users = await User.findByProtectedEntity(recipientPhone, 'sms');
    } else if (alertType === 'email' && recipientEmail) {
      users = await User.findByProtectedEntity(recipientEmail, 'email');
    } else if (alertType === 'upi') {
      // For UPI, we need to check against user's registered UPI
      const recipientUPI = req.body.recipientUPI;
      if (recipientUPI) {
        users = await User.findByProtectedEntity(recipientUPI, 'upi');
      }
    }
    
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No protected users found for this entity.',
        alertsCreated: 0
      });
    }
    
    // Check risk of the incoming entity
    const riskResult = await calculateFraudRisk(fromEntity);
    
    let alertsCreated = 0;
    
    for (const user of users) {
      // Only create alert if risk is suspicious or higher
      if (riskResult.riskLevel !== 'safe') {
        const alertData = {
          alertType,
          fromEntity: fromEntity.toLowerCase().trim(),
          riskLevel: riskResult.riskLevel,
          riskScore: riskResult.score,
          message: message || `⚠️ ${riskResult.riskLevel.toUpperCase()} incoming ${alertType}`,
          category: riskResult.reportDetails[0]?.category || 'Unknown',
          createdAt: new Date(),
          acknowledged: false
        };
        
        user.pendingAlerts.push(alertData);
        
        // Keep only last 100 pending alerts
        if (user.pendingAlerts.length > 100) {
          user.pendingAlerts = user.pendingAlerts.slice(-100);
        }
        
        await user.save();
        
        // Get the saved alert with _id
        const savedAlert = user.pendingAlerts[user.pendingAlerts.length - 1];
        
        // ⚡ REAL-TIME: Send instant WebSocket alert
        websocketService.sendAlert(user._id.toString(), savedAlert);
        
        // ⚡ REAL-TIME: Send email notification for high/critical risk
        if (riskResult.riskLevel === 'critical' || riskResult.riskLevel === 'high') {
          await emailService.sendAlert(user.email, savedAlert);
        }
        
        alertsCreated++;
        
        console.log(`\n🚨 REAL-TIME ALERT TRIGGERED for user ${user.email}`);
        console.log(`   Type: ${alertType}`);
        console.log(`   From: ${fromEntity}`);
        console.log(`   Risk: ${riskResult.riskLevel} (Score: ${riskResult.score})`);
        console.log(`   WebSocket: ${websocketService.isUserConnected(user._id.toString()) ? 'DELIVERED' : 'USER OFFLINE'}`);
      }
    }
    
    res.json({
      success: true,
      message: `Alert processed. ${alertsCreated} user(s) notified in real-time.`,
      data: {
        alertsCreated,
        riskResult
      }
    });
  } catch (error) {
    console.error('Trigger alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering alert.'
    });
  }
});

// GET /api/alerts/history - Get alert history
router.get('/alerts/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = (req.user.alertHistory || []).slice(-limit).reverse();
    
    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert history.'
    });
  }
});

// ==========================================
// USER ACTION ROUTES (BLOCK/MARK SAFE)
// ==========================================

// POST /api/actions/block - Block an entity
router.post('/actions/block', authenticateToken, [
  body('entity')
    .trim()
    .notEmpty()
    .withMessage('Entity is required'),
  body('entityType')
    .isIn(['phone', 'email', 'upi'])
    .withMessage('Entity type must be one of: phone, email, upi')
], validate, async (req, res) => {
  try {
    const { entity, entityType } = req.body;
    
    // Check if already blocked
    const isAlreadyBlocked = req.user.blockedEntities.some(
      e => e.entity === entity.toLowerCase().trim() && e.entityType === entityType
    );
    
    if (isAlreadyBlocked) {
      return res.status(400).json({
        success: false,
        message: 'This entity is already blocked.'
      });
    }
    
    // Add to blocked list
    req.user.blockedEntities.push({
      entity: entity.toLowerCase().trim(),
      entityType,
      blockedAt: new Date()
    });
    
    // Remove from safe list if present
    req.user.markedSafeEntities = req.user.markedSafeEntities.filter(
      e => !(e.entity === entity.toLowerCase().trim() && e.entityType === entityType)
    );
    
    await req.user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'block_entity',
      targetEntity: entity.toLowerCase().trim(),
      entityType,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Entity blocked successfully.',
      data: {
        blockedEntity: {
          entity: entity.toLowerCase().trim(),
          entityType
        }
      }
    });
  } catch (error) {
    console.error('Block entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking entity.'
    });
  }
});

// POST /api/actions/mark-safe - Mark an entity as safe
router.post('/actions/mark-safe', authenticateToken, [
  body('entity')
    .trim()
    .notEmpty()
    .withMessage('Entity is required'),
  body('entityType')
    .isIn(['phone', 'email', 'upi'])
    .withMessage('Entity type must be one of: phone, email, upi')
], validate, async (req, res) => {
  try {
    const { entity, entityType } = req.body;
    
    // Check if already marked safe
    const isAlreadySafe = req.user.markedSafeEntities.some(
      e => e.entity === entity.toLowerCase().trim() && e.entityType === entityType
    );
    
    if (isAlreadySafe) {
      return res.status(400).json({
        success: false,
        message: 'This entity is already marked as safe.'
      });
    }
    
    // Add to safe list
    req.user.markedSafeEntities.push({
      entity: entity.toLowerCase().trim(),
      entityType,
      markedAt: new Date()
    });
    
    // Remove from blocked list if present
    req.user.blockedEntities = req.user.blockedEntities.filter(
      e => !(e.entity === entity.toLowerCase().trim() && e.entityType === entityType)
    );
    
    await req.user.save();
    
    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'mark_safe',
      targetEntity: entity.toLowerCase().trim(),
      entityType,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'Entity marked as safe.',
      data: {
        safeEntity: {
          entity: entity.toLowerCase().trim(),
          entityType
        }
      }
    });
  } catch (error) {
    console.error('Mark safe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking entity as safe.'
    });
  }
});

// GET /api/actions/my-lists - Get user's blocked and safe lists
router.get('/actions/my-lists', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        blockedEntities: req.user.blockedEntities,
        markedSafeEntities: req.user.markedSafeEntities
      }
    });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lists.'
    });
  }
});

// ==========================================
// ACTIVITY LOG ROUTES
// ==========================================

// GET /api/activity/my-history - Get user's activity history
router.get('/activity/my-history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const activities = await ActivityLog.getUserActivity(req.user._id, limit);
    
    res.json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity history.'
    });
  }
});

// ==========================================
// STATISTICS ROUTES
// ==========================================

// GET /api/stats/overview - Get platform statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      totalReports,
      recentReports,
      totalUsers,
      categoryStats,
      blockedEntitiesCount
    ] = await Promise.all([
      FraudReport.countDocuments({ isActive: true }),
      FraudReport.countDocuments({ 
        timestamp: { $gte: thirtyDaysAgo },
        isActive: true 
      }),
      User.countDocuments(),
      FraudReport.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Count total blocked entities across all users
      User.aggregate([
        { $unwind: { path: '$blockedEntities', preserveNullAndEmptyArrays: false } },
        { $count: 'total' }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalReports,
        recentReports,
        totalUsers,
        blockedEntities: blockedEntitiesCount[0]?.total || 0,
        topCategories: categoryStats.map(c => ({
          category: c._id,
          count: c.count
        }))
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics.'
    });
  }
});

// ==========================================
// DEBUG ROUTES (Remove in production)
// ==========================================

// GET /api/debug/all-reports - View all fraud reports in database
router.get('/debug/all-reports', async (req, res) => {
  try {
    const reports = await FraudReport.find({}).sort({ timestamp: -1 }).limit(50);
    console.log('\\n========== ALL REPORTS IN DB ==========');
    console.log('Total count:', reports.length);
    reports.forEach(r => {
      console.log(`- ${r.targetEntity} | ${r.category} | ${r.timestamp} | active: ${r.isActive}`);
    });
    console.log('==========================================\\n');
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/debug/test-report - Create a test report without auth (for debugging)
router.post('/debug/test-report', async (req, res) => {
  try {
    const { targetEntity, entityType, category } = req.body;
    
    const report = new FraudReport({
      reporterId: null,
      targetEntity: targetEntity.toLowerCase().trim(),
      entityType: entityType || 'phone',
      category: category || 'Phishing',
      description: 'Test report for debugging',
      timestamp: new Date(),
      isActive: true
    });
    
    await report.save();
    console.log('\\n========== TEST REPORT CREATED ==========');
    console.log('Entity:', report.targetEntity);
    console.log('Category:', report.category);
    console.log('ID:', report._id);
    console.log('==========================================\\n');
    
    res.json({
      success: true,
      message: 'Test report created',
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADMIN PANEL ROUTES
// ==========================================

const { requireAdmin } = require('../middleware/auth');

// GET /api/admin/stats - Get comprehensive admin statistics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // User statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const lockedAccounts = await User.countDocuments({
      lockUntil: { $gt: new Date() }
    });
    
    // Report statistics
    const totalReports = await FraudReport.countDocuments();
    const activeReports = await FraudReport.countDocuments({ isActive: true });
    const reportsThisMonth = await FraudReport.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    
    // Reports by category
    const reportsByCategory = await FraudReport.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Reports by entity type
    const reportsByEntityType = await FraudReport.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);
    
    // Activity logs
    const recentActivity = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'name email');
    
    // Risk check counts
    const riskChecksToday = await ActivityLog.countDocuments({
      actionType: 'check_risk',
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    // Blacklisted tokens count
    const blacklistedTokens = await BlacklistedToken.countDocuments();
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          newThisMonth: newUsersThisMonth,
          lockedAccounts
        },
        reports: {
          total: totalReports,
          active: activeReports,
          inactive: totalReports - activeReports,
          thisMonth: reportsThisMonth,
          byCategory: reportsByCategory,
          byEntityType: reportsByEntityType
        },
        activity: {
          riskChecksToday,
          recentActivity
        },
        security: {
          blacklistedTokens
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics.'
    });
  }
});

// GET /api/admin/users - List all users with pagination
router.get('/admin/users', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin', 'moderator']),
  query('verified').optional().isBoolean().toBoolean()
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const queryFilter = {};
    
    if (req.query.search) {
      queryFilter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.role) {
      queryFilter.role = req.query.role;
    }
    
    if (req.query.verified !== undefined) {
      queryFilter.isEmailVerified = req.query.verified;
    }
    
    const total = await User.countDocuments(queryFilter);
    const users = await User.find(queryFilter)
      .select('-password -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users.'
    });
  }
});

// PATCH /api/admin/users/:userId - Update user (admin actions)
router.patch('/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isEmailVerified, unlockAccount } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Update role
    if (role && ['user', 'admin', 'moderator'].includes(role)) {
      user.role = role;
    }
    
    // Update email verification status
    if (isEmailVerified !== undefined) {
      user.isEmailVerified = isEmailVerified;
    }
    
    // Unlock account
    if (unlockAccount) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
    
    await user.save();
    
    // Log admin action
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'admin_user_update',
      targetEntity: user.email,
      details: { targetUserId: userId, changes: req.body },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user.'
    });
  }
});

// GET /api/admin/reports - List all reports with pagination
router.get('/admin/reports', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional(),
  query('entityType').optional().isIn(['phone', 'email', 'upi']),
  query('isActive').optional().isBoolean().toBoolean()
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const queryFilter = {};
    
    if (req.query.category) {
      queryFilter.category = req.query.category;
    }
    
    if (req.query.entityType) {
      queryFilter.entityType = req.query.entityType;
    }
    
    if (req.query.isActive !== undefined) {
      queryFilter.isActive = req.query.isActive;
    }
    
    const total = await FraudReport.countDocuments(queryFilter);
    const reports = await FraudReport.find(queryFilter)
      .populate('reporterId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    console.error('Admin reports list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports.'
    });
  }
});

// DELETE /api/admin/reports/:reportId - Delete/deactivate a report
router.delete('/admin/reports/:reportId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { permanent } = req.query;
    
    const report = await FraudReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }
    
    if (permanent === 'true') {
      await FraudReport.findByIdAndDelete(reportId);
    } else {
      report.isActive = false;
      await report.save();
    }
    
    // Log admin action
    await ActivityLog.logActivity({
      userId: req.user._id,
      actionType: 'admin_report_delete',
      targetEntity: report.targetEntity,
      details: { reportId, permanent: permanent === 'true' },
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      message: permanent === 'true' ? 'Report permanently deleted.' : 'Report deactivated.'
    });
  } catch (error) {
    console.error('Admin report delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report.'
    });
  }
});

// ==========================================
// PAGINATED PUBLIC ROUTES
// ==========================================

// GET /api/reports/paginated - Get reports with pagination (public)
router.get('/reports/paginated', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('category').optional(),
  query('entityType').optional().isIn(['phone', 'email', 'upi']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = Math.min(req.query.limit || 10, 50); // Max 50 per page
    const skip = (page - 1) * limit;
    
    // Build query
    const queryFilter = { isActive: true };
    
    if (req.query.category) {
      queryFilter.category = req.query.category;
    }
    
    if (req.query.entityType) {
      queryFilter.entityType = req.query.entityType;
    }
    
    if (req.query.search) {
      queryFilter.targetEntity = { $regex: req.query.search, $options: 'i' };
    }
    
    const total = await FraudReport.countDocuments(queryFilter);
    const reports = await FraudReport.find(queryFilter)
      .select('targetEntity entityType category timestamp')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    console.error('Paginated reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports.'
    });
  }
});

module.exports = router;
