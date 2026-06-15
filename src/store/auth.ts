import { useState, useCallback, useEffect } from 'react';
import type { UserRole, User } from '../types';

const USERS: Record<UserRole, User> = {
  receptionist: { id: 'R001', name: '张接单', role: 'receptionist', avatar: '👩' },
  designer: { id: 'D001', name: '李设计', role: 'designer', avatar: '👨‍🎨' },
  installer: { id: 'I001', name: '王队长', role: 'installer', avatar: '👷' },
  production: { id: 'P001', name: '赵喷绘', role: 'production', avatar: '👨‍🔧' },
  quality: { id: 'Q001', name: '质检刘', role: 'quality', avatar: '🔍' },
  admin: { id: 'A001', name: '管理员', role: 'admin', avatar: '👨‍💼' },
  customer: { id: 'C001', name: '客户', role: 'customer', avatar: '👤' },
};

const STORAGE_KEY = 'current_user';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const login = useCallback((role: UserRole) => {
    setCurrentUser(USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentUser(USERS[role]);
  }, []);

  return {
    currentUser,
    login,
    logout,
    switchRole,
    isLoggedIn: !!currentUser,
  };
}
