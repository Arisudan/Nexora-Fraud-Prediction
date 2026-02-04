// FILE: routes/api.js
// API Routes for Authentication, Fraud Reporting, and Risk Checking

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');

const User = require('../models/User');
const FraudReport = require('../models/FraudReport');
const ActivityLog = require('../models/ActivityLog');
const { 
  authenticateToken, 
  optionalAuth,
  requireKYC,
  generateToken 
} = require('../middleware/auth');

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

// POST /api/auth/register - User Registration
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
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password
    });
    
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
    
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: user.getPublicProfile(),
        token
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

// POST /api/auth/login - User Login
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
    
    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
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
        token
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

// POST /api/kyc/verify-otp - Verify OTP (Mocked for now)
router.post('/kyc/verify-otp', authenticateToken, [
  body('otp')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits')
], validate, async (req, res) => {
  try {
    const { otp } = req.body;
    
    // MOCK OTP VERIFICATION - Always returns true for development
    // In production, integrate with SMS gateway like Twilio, MSG91, etc.
    const isValidOTP = true; // Mock: Always valid
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
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

// POST /api/kyc/send-otp - Send OTP (Mocked)
router.post('/kyc/send-otp', authenticateToken, async (req, res) => {
  try {
    // MOCK: In production, send actual OTP via SMS gateway
    // For now, just return success
    
    res.json({
      success: true,
      message: 'OTP sent successfully to your phone number.',
      data: {
        // In development, we can show the mock OTP
        mockOTP: '123456' // Remove in production
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
    .isIn(['phone', 'email', 'upi', 'bank'])
    .withMessage('Entity type must be one of: phone, email, upi, bank'),
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
    .isIn(['phone', 'email', 'upi', 'bank'])
    .withMessage('Entity type must be one of: phone, email, upi, bank')
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
// USER ACTION ROUTES (BLOCK/MARK SAFE)
// ==========================================

// POST /api/actions/block - Block an entity
router.post('/actions/block', authenticateToken, [
  body('entity')
    .trim()
    .notEmpty()
    .withMessage('Entity is required'),
  body('entityType')
    .isIn(['phone', 'email', 'upi', 'bank'])
    .withMessage('Entity type must be one of: phone, email, upi, bank')
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
    .isIn(['phone', 'email', 'upi', 'bank'])
    .withMessage('Entity type must be one of: phone, email, upi, bank')
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
      categoryStats
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
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalReports,
        recentReports,
        totalUsers,
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

module.exports = router;
