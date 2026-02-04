// FILE: models/User.js
// User Schema for authentication and KYC storage

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
    select: false // Don't return password by default in queries
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
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  blockedEntities: [{
    entity: { type: String },
    entityType: { type: String, enum: ['phone', 'email', 'upi', 'bank'] },
    blockedAt: { type: Date, default: Date.now }
  }],
  markedSafeEntities: [{
    entity: { type: String },
    entityType: { type: String, enum: ['phone', 'email', 'upi', 'bank'] },
    markedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt with cost factor of 12
    const salt = await bcrypt.genSalt(12);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile (without sensitive data)
UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    isVerified: this.isVerified,
    kycCompleted: this.kycCompleted,
    role: this.role,
    createdAt: this.createdAt
  };
};

// Static method to find user by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', UserSchema);
