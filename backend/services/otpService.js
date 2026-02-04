// FILE: services/otpService.js
// Real-time OTP Generation, Storage, and Verification Service

const crypto = require('crypto');

// In-memory OTP store (for development)
// In production, use Redis for distributed systems
const otpStore = new Map();

// OTP Configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  cooldownMinutes: 1
};

// ==========================================
// OTP GENERATION
// ==========================================

const generateOTP = (length = OTP_CONFIG.length) => {
  // Generate cryptographically secure random OTP
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  
  return otp;
};

// ==========================================
// OTP STORAGE & VERIFICATION
// ==========================================

const createOTPKey = (identifier, purpose) => {
  return `${purpose}:${identifier.toLowerCase().trim()}`;
};

const otpService = {
  /**
   * Generate and store OTP for an identifier (email/phone)
   * @param {string} identifier - Email or phone number
   * @param {string} purpose - Purpose of OTP (verification, login, reset)
   * @returns {object} - OTP details
   */
  generate: (identifier, purpose = 'verification') => {
    const key = createOTPKey(identifier, purpose);
    const now = Date.now();
    
    // Check cooldown
    const existing = otpStore.get(key);
    if (existing) {
      const cooldownMs = OTP_CONFIG.cooldownMinutes * 60 * 1000;
      const timeSinceCreation = now - existing.createdAt;
      
      if (timeSinceCreation < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - timeSinceCreation) / 1000);
        return {
          success: false,
          error: 'cooldown',
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
          waitSeconds
        };
      }
    }
    
    const otp = generateOTP();
    const expiresAt = now + (OTP_CONFIG.expiryMinutes * 60 * 1000);
    
    // Store OTP
    otpStore.set(key, {
      otp,
      createdAt: now,
      expiresAt,
      attempts: 0,
      verified: false
    });
    
    console.log(`🔐 OTP generated for ${identifier} [${purpose}]: ${otp}`);
    
    return {
      success: true,
      otp,
      expiresAt,
      expiresInMinutes: OTP_CONFIG.expiryMinutes
    };
  },
  
  /**
   * Verify OTP for an identifier
   * @param {string} identifier - Email or phone number
   * @param {string} inputOTP - User-provided OTP
   * @param {string} purpose - Purpose of OTP
   * @returns {object} - Verification result
   */
  verify: (identifier, inputOTP, purpose = 'verification') => {
    const key = createOTPKey(identifier, purpose);
    const stored = otpStore.get(key);
    
    // Check if OTP exists
    if (!stored) {
      return {
        success: false,
        error: 'not_found',
        message: 'No OTP found. Please request a new one.'
      };
    }
    
    // Check if already verified
    if (stored.verified) {
      return {
        success: false,
        error: 'already_used',
        message: 'This OTP has already been used.'
      };
    }
    
    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return {
        success: false,
        error: 'expired',
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Check max attempts
    if (stored.attempts >= OTP_CONFIG.maxAttempts) {
      otpStore.delete(key);
      return {
        success: false,
        error: 'max_attempts',
        message: 'Maximum attempts exceeded. Please request a new OTP.'
      };
    }
    
    // Increment attempts
    stored.attempts++;
    
    // Verify OTP
    if (stored.otp !== inputOTP.trim()) {
      const remainingAttempts = OTP_CONFIG.maxAttempts - stored.attempts;
      return {
        success: false,
        error: 'invalid',
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        remainingAttempts
      };
    }
    
    // OTP is valid - mark as verified
    stored.verified = true;
    
    console.log(`✅ OTP verified for ${identifier} [${purpose}]`);
    
    // Clean up after successful verification
    setTimeout(() => {
      otpStore.delete(key);
    }, 5000);
    
    return {
      success: true,
      message: 'OTP verified successfully!'
    };
  },
  
  /**
   * Invalidate/delete OTP
   * @param {string} identifier 
   * @param {string} purpose 
   */
  invalidate: (identifier, purpose = 'verification') => {
    const key = createOTPKey(identifier, purpose);
    otpStore.delete(key);
  },
  
  /**
   * Check if OTP exists and is valid (without verifying)
   * @param {string} identifier 
   * @param {string} purpose 
   */
  check: (identifier, purpose = 'verification') => {
    const key = createOTPKey(identifier, purpose);
    const stored = otpStore.get(key);
    
    if (!stored) {
      return { exists: false };
    }
    
    const isExpired = Date.now() > stored.expiresAt;
    const remainingSeconds = Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000));
    
    return {
      exists: true,
      isExpired,
      isVerified: stored.verified,
      remainingSeconds,
      attempts: stored.attempts,
      maxAttempts: OTP_CONFIG.maxAttempts
    };
  },
  
  // Cleanup expired OTPs (call periodically)
  cleanup: () => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of otpStore.entries()) {
      // Remove expired or verified OTPs older than 5 minutes
      if (now > value.expiresAt || (value.verified && now - value.createdAt > 300000)) {
        otpStore.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired OTPs`);
    }
  },
  
  // Get store size (for monitoring)
  getStoreSize: () => otpStore.size
};

// Run cleanup every 5 minutes
setInterval(otpService.cleanup, 5 * 60 * 1000);

module.exports = otpService;
