// FILE: context/AuthContext.js
// Authentication Context for managing user state across the application

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      if (token && storedUser) {
        // Validate token by fetching profile
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    
    if (response.success) {
      const { user, token } = response.data;
      
      // Store in sessionStorage (clears on browser close/refresh)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    }
    
    return { success: false, message: response.message };
  };

  const register = async (registrationData) => {
    const response = await authAPI.register(registrationData);
    
    if (response.success) {
      // Don't auto-login after registration
      // User will be redirected to login page to enter credentials
      return { success: true, message: 'Registration successful!' };
    }
    
    return { success: false, message: response.message };
  };

  const logout = () => {
    // Clear storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
