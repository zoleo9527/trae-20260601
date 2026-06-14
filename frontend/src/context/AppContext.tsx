import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Customer, DueDiligence, Notification } from '../types';
import { api } from '../api';

interface AppContextType {
  user: User | null;
  customers: Customer[];
  dueDiligences: DueDiligence[];
  notifications: Notification[];
  loading: boolean;
  login: (username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  refreshCustomers: () => Promise<void>;
  refreshDueDiligences: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dueDiligences, setDueDiligences] = useState<DueDiligence[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.users.me().then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshCustomers();
      refreshDueDiligences();
      refreshNotifications();
    }
  }, [user]);

  const login = async (username: string, password: string, role: Role): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.users.login(username, password, role);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCustomers([]);
    setDueDiligences([]);
    setNotifications([]);
  };

  const refreshCustomers = async () => {
    const res = await api.customers.list();
    if (res.success && res.data) {
      setCustomers(res.data);
    }
  };

  const refreshDueDiligences = async () => {
    const res = await api.dueDiligence.list();
    if (res.success && res.data) {
      setDueDiligences(res.data);
    }
  };

  const refreshNotifications = async () => {
    const res = await api.notifications.list();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        customers,
        dueDiligences,
        notifications,
        loading,
        login,
        logout,
        refreshCustomers,
        refreshDueDiligences,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
