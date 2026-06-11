'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Role } from '@/types';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUsers: Record<Role, User> = {
  manager: { id: 'm001', name: '张经理', role: 'manager' },
  consultant: { id: 'u001', name: '李娜', role: 'consultant' },
  controller: { id: 'u004', name: '王主任', role: 'controller' },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUsers.consultant);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <AppContext.Provider
      value={{ currentUser, setCurrentUser, refreshTrigger, triggerRefresh }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { defaultUsers };
