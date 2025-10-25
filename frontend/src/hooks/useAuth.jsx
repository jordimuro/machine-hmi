import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import wsClient from '../services/wsClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('hmi_token');
    if (token) {
      apiClient.setToken(token);
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token validity
  const verifyToken = async () => {
    try {
      const data = await apiClient.getCurrentUser();
      setUser(data);

      // Connect WebSocket
      const token = localStorage.getItem('hmi_token');
      wsClient.connect(token);
    } catch (err) {
      console.error('Token verification failed', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login with PIN
  const login = async (pin) => {
    setError(null);
    setLoading(true);

    try {
      const data = await apiClient.login(pin);
      setUser({ role: data.role });

      // Connect WebSocket
      wsClient.connect(data.token);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    wsClient.disconnect();
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isMaintenance: user?.role === 'maintenance',
    isOperator: user?.role === 'operator',
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
