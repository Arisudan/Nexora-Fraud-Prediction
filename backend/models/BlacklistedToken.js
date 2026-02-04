// FILE: models/BlacklistedToken.js
// Token Blacklist for secure logout functionality

const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['logout', 'password_change', 'security_concern', 'admin_action'],
    default: 'logout'
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // For TTL cleanup
  }
});

// TTL index - automatically delete expired tokens
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to check if token is blacklisted
BlacklistedTokenSchema.statics.isBlacklisted = async function(token) {
  const blacklisted = await this.findOne({ token });
  return !!blacklisted;
};

// Static method to blacklist a token
BlacklistedTokenSchema.statics.blacklistToken = async function(token, userId, expiresAt, reason = 'logout') {
  try {
    const blacklistedToken = new this({
      token,
      userId,
      reason,
      expiresAt
    });
    await blacklistedToken.save();
    return true;
  } catch (error) {
    // Handle duplicate key error (token already blacklisted)
    if (error.code === 11000) {
      return true;
    }
    throw error;
  }
};

// Static method to blacklist all tokens for a user
BlacklistedTokenSchema.statics.blacklistAllUserTokens = async function(userId, reason = 'security_concern') {
  // This is a placeholder - in production, you'd track all active tokens
  // For now, we just log the action
  console.log(`All tokens for user ${userId} should be invalidated. Reason: ${reason}`);
  return true;
};

// Cleanup old expired tokens (called periodically)
BlacklistedTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);
