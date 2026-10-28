import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

export type UserRole = 'guest' | 'staff' | 'manager' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  assignedHotelId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => Promise<void>;
  dbStatus: any;
  refreshDbStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  guest: { email: 'guest@hotelpro.com', pass: 'Guest@1234' },
  staff: { email: 'staff@hotelpro.com', pass: 'Staff@1234' },
  manager: { email: 'manager@hotelpro.com', pass: 'Manager@1234' },
  admin: { email: 'admin@hotelpro.com', pass: 'Admin@1234' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hotelpro_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('hotelpro_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      localStorage.removeItem('hotelpro_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshDbStatus = async () => {
    try {
      const res = await api.get('/health');
      setDbStatus(res.data.database);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    refreshDbStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('hotelpro_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Authentication error' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        localStorage.setItem('hotelpro_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Registration error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('hotelpro_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
        dbStatus,
        refreshDbStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
