import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { login as apiLogin, getProfile } from '../api';

const STORAGE_KEY = 'volunteer_token';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      getProfile().then(user => {
        setUser(user);
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    localStorage.setItem(STORAGE_KEY, result.token);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
