import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, ROLE_LABELS } from '../types';

interface AuthContextType {
  role: UserRole;
  userName: string;
  setRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  roleLabel: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('user_role');
    return (saved as UserRole) || 'ops_supervisor';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('user_name') || '钱红';
  });

  useEffect(() => {
    localStorage.setItem('user_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  const roleLabel = ROLE_LABELS[role];

  return (
    <AuthContext.Provider value={{ role, userName, setRole, setUserName, roleLabel }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
