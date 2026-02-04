// FILE: models/User.js
// User Schema for authentication, KYC storage, and protection preferences

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  kycCompleted: {
    type: Boolean,
    default: false
  },
  kycDetails: {
    phone: { type: String },
    address: { type: String },
    idNumber: { type: String },
    verifiedAt: { type: Date }
  },
  
  // ==========================================
  // PROTECTION PREFERENCES - Industrial Grade
  // ==========================================
  protectionSettings: {
    callProtection: {
      enabled: { type: Boolean, default: false },
      registeredPhone: { type: String },
      alertMode: { type: String, enum: ['popup', 'silent', 'block'], default: 'popup' },
      activatedAt: { type: Date }
    },
    smsProtection: {
      enabled: { type: Boolean, default: false },
      registeredPhone: { type: String },
      alertMode: { type: String, enum: ['popup', 'silent', 'block'], default: 'popup' },
      activatedAt: { type: Date }
    },
    emailProtection: {
      enabled: { type: Boolean, default: false },
      registeredEmail: { type: String },
      alertMode: { type: String, enum: ['popup', 'silent', 'block'], default: 'popup' },
      activatedAt: { type: Date }
    }
  },
  
  pendingAlerts: [{
    alertType: { type: String, enum: ['call', 'sms', 'email'] },
    fromEntity: { type: String },
    riskLevel: { type: String },
    riskScore: { type: Number },
    message: { type: String },
    category: { type: String },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date }
  }],
  
  alertHistory: [{
    alertType: { type: String },
    fromEntity: { type: String },
    riskLevel: { type: String },
    riskScore: { type: Number },
    action: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  blockedEntities: [{
    entity: { type: String },
    entityType: { type: String, enum: ['phone', 'email', 'bank'] },
    blockedAt: { type: Date, default: Date.now }
  }],
  markedSafeEntities: [{
    entity: { type: String },
    entityType: { type: String, enum: ['phone', 'email', 'bank'] },
    markedAt: { type: Date, default: Date.now }
  }],
  
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    isVerified: this.isVerified,
    kycCompleted: this.kycCompleted,
    role: this.role,
    protectionSettings: this.protectionSettings,
    subscriptionTier: this.subscriptionTier,
    pendingAlertsCount: this.pendingAlerts?.filter(a => !a.acknowledged).length || 0,
    createdAt: this.createdAt
  };
};

UserSchema.methods.getEnabledProtections = function() {
  const protections = [];
  if (this.protectionSettings?.callProtection?.enabled) protections.push('call');
  if (this.protectionSettings?.smsProtection?.enabled) protections.push('sms');
  if (this.protectionSettings?.emailProtection?.enabled) protections.push('email');
  return protections;
};

UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByProtectedEntity = function(entity, entityType) {
  const normalized = entity.toLowerCase().trim().replace(/[\s\-\(\)\+\.]/g, '');
  switch(entityType) {
    case 'call':
      return this.find({ 'protectionSettings.callProtection.enabled': true, 'protectionSettings.callProtection.registeredPhone': normalized });
    case 'sms':
      return this.find({ 'protectionSettings.smsProtection.enabled': true, 'protectionSettings.smsProtection.registeredPhone': normalized });
    case 'email':
      return this.find({ 'protectionSettings.emailProtection.enabled': true, 'protectionSettings.emailProtection.registeredEmail': entity.toLowerCase().trim() });
    default:
      return Promise.resolve([]);
  }
};

module.exports = mongoose.model('User', UserSchema);
