import { create } from "zustand";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/utils/mock";

interface UserState {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
}

const STORAGE_KEY = "live_review_current_user";

function loadFromStorage(): User {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load user from storage", e);
  }
  return mockUsers[1];
}

function saveToStorage(user: User) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user to storage", e);
  }
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: loadFromStorage(),

  setCurrentUser: (user: User) => {
    saveToStorage(user);
    set({ currentUser: user });
  },

  switchRole: (role: UserRole) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      saveToStorage(user);
      set({ currentUser: user });
    }
  },
}));
