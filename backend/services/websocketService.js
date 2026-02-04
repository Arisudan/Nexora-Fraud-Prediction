// FILE: services/websocketService.js
// Real-time WebSocket Service for Instant Alert Delivery

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const connectedUsers = new Map(); // userId -> Set of socket IDs

// ==========================================
// WEBSOCKET INITIALIZATION
// ==========================================

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    console.log(`🔌 User connected: ${userId} (socket: ${socket.id})`);
    
    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'Real-time connection established',
      timestamp: new Date().toISOString()
    });

    // Handle client events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle alert acknowledgment
    socket.on('alert:acknowledge', async (data) => {
      try {
        const { alertId, action } = data;
        console.log(`📥 Alert ${alertId} acknowledged by ${userId}: ${action}`);
        
        // Emit confirmation back to user
        socket.emit('alert:acknowledged', {
          alertId,
          action,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to acknowledge alert' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${userId} (${reason})`);
      
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${userId}:`, error);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
};

// ==========================================
// REAL-TIME EMISSION FUNCTIONS
// ==========================================

const websocketService = {
  initialize: initializeWebSocket,
  
  /**
   * Get Socket.IO instance
   */
  getIO: () => io,
  
  /**
   * Check if user is connected
   * @param {string} userId 
   */
  isUserConnected: (userId) => {
    return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
  },
  
  /**
   * Get connected users count
   */
  getConnectedUsersCount: () => connectedUsers.size,
  
  /**
   * Send real-time alert to a specific user
   * @param {string} userId - Target user ID
   * @param {object} alertData - Alert information
   */
  sendAlert: (userId, alertData) => {
    if (!io) {
      console.warn('WebSocket not initialized');
      return false;
    }

    const payload = {
      type: 'fraud_alert',
      alert: {
        _id: alertData._id || alertData.id,
        alertType: alertData.alertType,
        fromEntity: alertData.fromEntity,
        riskLevel: alertData.riskLevel,
        riskScore: alertData.riskScore,
        message: alertData.message,
        category: alertData.category,
        createdAt: alertData.createdAt || new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    io.to(`user:${userId}`).emit('alert:new', payload);
    
    console.log(`📤 Real-time alert sent to user ${userId}: ${alertData.alertType} from ${alertData.fromEntity}`);
    return true;
  },
  
  /**
   * Send OTP notification to user (for UI feedback)
   * @param {string} userId 
   * @param {object} data 
   */
  sendOTPNotification: (userId, data) => {
    if (!io) return false;
    
    io.to(`user:${userId}`).emit('otp:sent', {
      message: data.message || 'OTP sent to your email',
      expiresInMinutes: data.expiresInMinutes || 10,
      timestamp: new Date().toISOString()
    });
    
    return true;
  },
  
  /**
   * Send general notification to user
   * @param {string} userId 
   * @param {object} notification 
   */
  sendNotification: (userId, notification) => {
    if (!io) return false;
    
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    return true;
  },
  
  /**
   * Broadcast to all connected users (use sparingly)
   * @param {string} event 
   * @param {object} data 
   */
  broadcast: (event, data) => {
    if (!io) return false;
    
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    return true;
  },
  
  /**
   * Send system-wide alert (e.g., new fraud pattern detected)
   * @param {object} data 
   */
  broadcastSystemAlert: (data) => {
    if (!io) return false;
    
    io.emit('system:alert', {
      type: 'system_alert',
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📢 System alert broadcast: ${data.message || 'System notification'}`);
    return true;
  },
  
  /**
   * Get connection statistics
   */
  getStats: () => ({
    totalConnections: io ? io.engine.clientsCount : 0,
    uniqueUsers: connectedUsers.size,
    userConnections: Array.from(connectedUsers.entries()).map(([userId, sockets]) => ({
      userId,
      connections: sockets.size
    }))
  })
};

module.exports = websocketService;
