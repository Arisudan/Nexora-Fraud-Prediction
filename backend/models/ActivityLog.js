// FILE: models/ActivityLog.js
// Activity Log Schema for tracking all user activities (searches, reports, actions)

const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actionType: {
    type: String,
    required: [true, 'Action type is required'],
    enum: {
      values: [
        'search',
        'report_fraud',
        'check_risk',
        'block_entity',
        'mark_safe',
        'login',
        'logout',
        'register',
        'kyc_submit',
        'otp_verify',
        'view_report',
        'update_report'
      ],
      message: 'Invalid action type'
    },
    index: true
  },
  targetEntity: {
    type: String,
    trim: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['phone', 'email', 'upi', 'none'],
    default: 'none'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  result: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  riskLevel: {
    type: String,
    enum: ['safe', 'suspicious', 'high_risk', 'none'],
    default: 'none'
  },
  riskScore: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  metadata: {
    browser: { type: String },
    os: { type: String },
    device: { type: String },
    location: {
      city: { type: String },
      country: { type: String }
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for analytics queries
ActivityLogSchema.index({ userId: 1, actionType: 1, timestamp: -1 });
ActivityLogSchema.index({ actionType: 1, timestamp: -1 });
ActivityLogSchema.index({ targetEntity: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 1 year (365 days)
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Static method to log an activity
ActivityLogSchema.statics.logActivity = async function(activityData) {
  try {
    const log = new this(activityData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging should not break main flow
    return null;
  }
};

// Static method to get user activity history
ActivityLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get search history for an entity
ActivityLogSchema.statics.getEntitySearchHistory = function(targetEntity) {
  return this.find({
    targetEntity: targetEntity.toLowerCase().trim(),
    actionType: { $in: ['search', 'check_risk'] }
  })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();
};

// Static method to get activity statistics
ActivityLogSchema.statics.getStatistics = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return stats;
};

// Static method to get recent high-risk checks
ActivityLogSchema.statics.getRecentHighRiskChecks = function(limit = 20) {
  return this.find({
    actionType: 'check_risk',
    riskLevel: 'high_risk'
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
