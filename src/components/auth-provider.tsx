"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Role } from "@/types";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  token: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const STORAGE_KEY = "recycle_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  async function login(username: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "登录失败");
    const data: AuthUser = await res.json();
    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-auth-user": token,
  };
}
