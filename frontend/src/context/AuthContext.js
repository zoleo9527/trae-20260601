import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('training_manager');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentRole) {
      fetchPermissions(currentRole);
    }
  }, [currentRole]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/current-user');
      setUser(response.data.user);
      setCurrentRole(response.data.currentRole);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (role) => {
    try {
      const response = await api.get('/auth/permissions', { params: { role } });
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('获取权限信息失败:', error);
    }
  };

  const switchRole = async (newRole) => {
    try {
      const response = await api.post('/auth/switch-role', { role: newRole });
      setUser(response.data.user);
      setCurrentRole(response.data.currentRole);
      return response.data;
    } catch (error) {
      console.error('切换角色失败:', error);
      throw error;
    }
  };

  const hasPermission = (module, action) => {
    if (!permissions[module]) return false;
    return permissions[module].includes(action);
  };

  const value = {
    user,
    currentRole,
    permissions,
    loading,
    switchRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
