// FILE: context/SocketContext.js
// Real-time WebSocket Connection Context for Instant Alerts

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState([]);

  // Initialize socket connection
  const connect = useCallback((token) => {
    if (socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('✅ Real-time connection established:', data.message);
      toast.success('Real-time protection active', { duration: 2000, icon: '🛡️' });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    // Real-time alert handling
    newSocket.on('alert:new', (data) => {
      console.log('🚨 Real-time alert received:', data);
      
      // Add to pending alerts
      setPendingAlerts(prev => {
        // Avoid duplicates
        const exists = prev.some(a => a._id === data.alert._id);
        if (exists) return prev;
        return [data.alert, ...prev];
      });
      
      // Show toast notification
      const riskColors = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-2xl">{riskColors[data.alert.riskLevel] || '⚠️'}</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {data.alert.alertType.toUpperCase()} Alert - {data.alert.riskLevel.toUpperCase()} RISK
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  From: {data.alert.fromEntity}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            >
              View
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    });

    // Alert acknowledgment confirmation
    newSocket.on('alert:acknowledged', (data) => {
      console.log('✅ Alert acknowledged:', data);
      setPendingAlerts(prev => prev.filter(a => a._id !== data.alertId));
    });

    // OTP notification
    newSocket.on('otp:sent', (data) => {
      console.log('📧 OTP sent notification:', data);
      toast.success(data.message, { icon: '📧' });
    });

    // General notifications
    newSocket.on('notification', (data) => {
      console.log('📬 Notification:', data);
      if (data.type === 'verification_success') {
        toast.success(data.message, { icon: '✅' });
      } else {
        toast(data.message || 'New notification', { icon: 'ℹ️' });
      }
    });

    // System alerts
    newSocket.on('system:alert', (data) => {
      console.log('📢 System alert:', data);
      toast(data.message, { icon: '📢', duration: 5000 });
    });

    // Pong response for connection testing
    newSocket.on('pong', (data) => {
      console.log('Pong received:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socket]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setPendingAlerts([]);
    }
  }, [socket]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId, action) => {
    if (socket?.connected) {
      socket.emit('alert:acknowledge', { alertId, action });
    }
    // Optimistically remove from pending
    setPendingAlerts(prev => prev.filter(a => a._id !== alertId));
  }, [socket]);

  // Send ping (for testing connection)
  const ping = useCallback(() => {
    if (socket?.connected) {
      socket.emit('ping');
    }
  }, [socket]);

  // Clear all pending alerts
  const clearAlerts = useCallback(() => {
    setPendingAlerts([]);
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !socket) {
      connect(token);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    pendingAlerts,
    connect,
    disconnect,
    acknowledgeAlert,
    ping,
    clearAlerts
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
