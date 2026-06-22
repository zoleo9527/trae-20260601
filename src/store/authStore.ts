import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { mockUsers, roleCredentials } from '../data/mockData';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  login: (employeeNo: string, password: string) => Promise<boolean>;
  logout: () => void;
  setSelectedRole: (role: UserRole | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  selectedRole: null,

  login: async (employeeNo: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const credential = Object.values(roleCredentials).find(
      (c) => c.employeeNo === employeeNo && c.password === password
    );

    if (!credential) {
      return false;
    }

    const user = mockUsers.find((u) => u.employeeNo === employeeNo);
    if (!user) {
      return false;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true, selectedRole: user.role });
    return true;
  },

  logout: () => {
    localStorage.removeItem('currentUser');
    set({ currentUser: null, isAuthenticated: false, selectedRole: null });
  },

  setSelectedRole: (role: UserRole | null) => {
    set({ selectedRole: role });
  },
}));
