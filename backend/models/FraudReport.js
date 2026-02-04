// FILE: models/FraudReport.js
// Fraud Report Schema for storing user-submitted fraud reports

const mongoose = require('mongoose');

const FraudReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,  // Made optional for anonymous reports
    default: null
  },
  targetEntity: {
    type: String,
    required: [true, 'Target entity is required'],
    trim: true,
    lowercase: true,  // Automatically lowercase
    index: true
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['phone', 'email', 'upi'],
      message: 'Entity type must be one of: phone, email, upi'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Phishing',
        'Identity Theft',
        'Financial Fraud',
        'Spam',
        'Harassment',
        'Fake Lottery',
        'Investment Scam',
        'Romance Scam',
        'Tech Support Scam',
        'Other'
      ],
      message: 'Invalid category selected'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  evidence: {
    type: String,
    maxlength: [5000, 'Evidence text cannot exceed 5000 characters']
  },
  evidenceUrls: [{
    type: String,
    trim: true
  }],
  amountLost: {
    type: Number,
    default: 0,
    min: [0, 'Amount lost cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'under_review'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reporterLocation: {
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' }
  },
  incidentDate: {
    type: Date
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for faster queries
FraudReportSchema.index({ targetEntity: 1, timestamp: -1 });
FraudReportSchema.index({ category: 1, timestamp: -1 });
FraudReportSchema.index({ reporterId: 1, timestamp: -1 });
FraudReportSchema.index({ entityType: 1, targetEntity: 1 });

// Pre-save middleware to update timestamp
FraudReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find reports by target entity
FraudReportSchema.statics.findByTargetEntity = function(targetEntity) {
  return this.find({ 
    targetEntity: targetEntity.toLowerCase().trim(),
    isActive: true 
  }).sort({ timestamp: -1 });
};

// Static method to find recent reports (last 30 days)
FraudReportSchema.statics.findRecentByTargetEntity = function(targetEntity) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    targetEntity: targetEntity.toLowerCase().trim(),
    timestamp: { $gte: thirtyDaysAgo },
    isActive: true
  }).sort({ timestamp: -1 });
};

// Static method to get report statistics for an entity
FraudReportSchema.statics.getEntityStats = async function(targetEntity) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const stats = await this.aggregate([
    {
      $match: {
        targetEntity: targetEntity.toLowerCase().trim(),
        timestamp: { $gte: thirtyDaysAgo },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmountLost: { $sum: '$amountLost' }
      }
    }
  ]);
  
  return stats;
};

// Instance method to get report summary
FraudReportSchema.methods.getSummary = function() {
  return {
    id: this._id,
    targetEntity: this.targetEntity,
    entityType: this.entityType,
    category: this.category,
    description: this.description.substring(0, 100) + '...',
    status: this.status,
    timestamp: this.timestamp
  };
};

module.exports = mongoose.model('FraudReport', FraudReportSchema);
