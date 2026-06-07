import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { authAPI } from '@/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        authAPI.getMe()
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
          });
      }
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login(username, password);
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
