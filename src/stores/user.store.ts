import { create } from 'zustand';
import type { User } from '../types/user.types';
import { UserRole } from '../types/user.types';
import { UserService } from '../services/user.service';

interface UserState {
  currentUser: User | null;
  users: User[];
  surveyors: User[];
  loading: boolean;
  error: string | null;

  fetchCurrentUser: () => Promise<void>;
  fetchUsers: (role?: UserRole) => Promise<void>;
  fetchSurveyors: () => Promise<void>;
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  users: [],
  surveyors: [],
  loading: false,
  error: null,

  fetchCurrentUser: async () => {
    set({ loading: true, error: null });
    try {
      const service = new UserService();
      const user = service.getCurrentUser();
      set({ currentUser: user, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchUsers: async (role?: UserRole) => {
    set({ loading: true, error: null });
    try {
      const service = new UserService();
      const users = service.getUsers(role);
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchSurveyors: async () => {
    set({ loading: true, error: null });
    try {
      const service = new UserService();
      const surveyors = service.getSurveyors();
      set({ surveyors, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentUser: (user: User) => {
    const service = new UserService();
    service.setCurrentUser(user);
    set({ currentUser: user });
  }
}));
