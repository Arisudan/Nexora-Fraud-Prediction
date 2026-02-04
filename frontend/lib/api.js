// FILE: lib/api.js
// Axios API client for backend communication

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response) {
      const { status, data } = error.response;
      
      // Unauthorized - clear token and redirect to login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
      
      // Return error with message
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
      });
    }
    
    // Network error
    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    }
    
    return Promise.reject({
      status: 0,
      message: error.message || 'An unexpected error occurred',
    });
  }
);

// ==========================================
// AUTH API FUNCTIONS
// ==========================================

export const authAPI = {
  // Register new user with protection settings
  register: async (registrationData) => {
    const response = await api.post('/auth/register', registrationData);
    return response.data;
  },
  
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ==========================================
// PROTECTION SETTINGS API FUNCTIONS
// ==========================================

export const protectionAPI = {
  // Get current protection settings
  getSettings: async () => {
    const response = await api.get('/settings/protection');
    return response.data;
  },
  
  // Update protection settings
  updateSettings: async (settings) => {
    const response = await api.post('/settings/protection', settings);
    return response.data;
  },
};

// ==========================================
// ALERTS API FUNCTIONS
// ==========================================

export const alertsAPI = {
  // Get pending alerts
  getPending: async () => {
    const response = await api.get('/alerts/pending');
    return response.data;
  },
  
  // Acknowledge an alert
  acknowledge: async (alertId, action = 'acknowledged') => {
    const response = await api.post(`/alerts/acknowledge/${alertId}`, { action });
    return response.data;
  },
  
  // Get alert history
  getHistory: async (limit = 50) => {
    const response = await api.get(`/alerts/history?limit=${limit}`);
    return response.data;
  },
  
  // Simulate an incoming alert (for testing)
  triggerAlert: async (alertData) => {
    const response = await api.post('/alerts/trigger', alertData);
    return response.data;
  },
};

// ==========================================
// KYC API FUNCTIONS
// ==========================================

export const kycAPI = {
  // Submit KYC information
  submit: async (phone, address = '', idNumber = '') => {
    const response = await api.post('/kyc/submit', { phone, address, idNumber });
    return response.data;
  },
  
  // Send OTP
  sendOTP: async () => {
    const response = await api.post('/kyc/send-otp');
    return response.data;
  },
  
  // Verify OTP
  verifyOTP: async (otp) => {
    const response = await api.post('/kyc/verify-otp', { otp });
    return response.data;
  },
};

// ==========================================
// FRAUD REPORT API FUNCTIONS
// ==========================================

export const fraudAPI = {
  // Submit fraud report
  submitReport: async (reportData) => {
    const response = await api.post('/fraud/report', reportData);
    return response.data;
  },
  
  // Get user's reports
  getMyReports: async (page = 1, limit = 10) => {
    const response = await api.get(`/fraud/my-reports?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// ==========================================
// RISK CHECK API FUNCTIONS
// ==========================================

export const riskAPI = {
  // Check risk for an entity
  checkRisk: async (entity, entityType = 'phone') => {
    const response = await api.post('/check-risk', { entity, entityType });
    return response.data;
  },
  
  // Alternative GET method
  checkRiskGet: async (entity) => {
    const response = await api.get(`/check-risk/${encodeURIComponent(entity)}`);
    return response.data;
  },
};

// ==========================================
// USER ACTIONS API FUNCTIONS
// ==========================================

export const actionsAPI = {
  // Block an entity
  blockEntity: async (entity, entityType) => {
    const response = await api.post('/actions/block', { entity, entityType });
    return response.data;
  },
  
  // Mark entity as safe
  markSafe: async (entity, entityType) => {
    const response = await api.post('/actions/mark-safe', { entity, entityType });
    return response.data;
  },
  
  // Get user's blocked and safe lists
  getMyLists: async () => {
    const response = await api.get('/actions/my-lists');
    return response.data;
  },
};

// ==========================================
// ACTIVITY LOG API FUNCTIONS
// ==========================================

export const activityAPI = {
  // Get user's activity history
  getHistory: async (limit = 50) => {
    const response = await api.get(`/activity/my-history?limit=${limit}`);
    return response.data;
  },
};

// ==========================================
// STATISTICS API FUNCTIONS
// ==========================================

export const statsAPI = {
  // Get platform overview statistics
  getOverview: async () => {
    const response = await api.get('/stats/overview');
    return response.data;
  },
};

export default api;
