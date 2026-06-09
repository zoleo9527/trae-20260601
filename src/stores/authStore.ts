import { create } from "zustand";
import { api } from "@/api/client";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("auth_token"),
  loading: false,

  login: async (username: string) => {
    set({ loading: true });
    try {
      const res = await api.post<{ user: User; token: string }>(
        "/auth/login",
        { username, password: "demo" }
      );
      localStorage.setItem("auth_token", res.token);
      set({ user: res.user, token: res.token, loading: false });
    } catch {
      set({ loading: false });
      throw new Error("登录失败");
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, token: null });
  },

  restore: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      set({ user: res.user, token });
    } catch {
      localStorage.removeItem("auth_token");
      set({ user: null, token: null });
    }
  },
}));
