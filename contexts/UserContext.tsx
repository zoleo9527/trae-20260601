"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 从localStorage恢复用户信息
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      login(savedUserId);
    }
  }, []);

  const login = async (userId: string) => {
    try {
      const response = await fetch(`/api/users`);
      const users: User[] = await response.json();
      const foundUser = users.find((u) => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem("userId", userId);
      }
    } catch (error) {
      console.error("登录失败:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}