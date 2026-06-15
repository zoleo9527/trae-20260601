import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  Appeal, 
  Evidence, 
  AuditLog, 
  AppealSummary, 
  UserRole,
  AppealStatus,
  ROLE_ALLOWED_STATUS
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface HandleAppealRequest {
  appealId: string;
  action: 'forward' | 'reject' | 'return' | 'resolve';
  comment?: string;
  resolutionAmount?: number;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
}

interface AppealContextType {
  appeals: Appeal[];
  selectedAppeal: Appeal | null;
  summary: AppealSummary;
  currentUserId: string;
  currentUserRole: UserRole;
  isLoading: boolean;
  error: { code: string; message: string } | null;
  
  setSelectedAppeal: (appeal: Appeal | null) => void;
  fetchAppeals: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  handleAppeal: (request: HandleAppealRequest) => Promise<ApiResponse<{ appeal: Appeal; auditLog: AuditLog }>>;
  getEvidences: (appealId: string) => Promise<Evidence[]>;
  getAuditLogs: (appealId: string) => Promise<AuditLog[]>;
  setCurrentUser: (userId: string, role: UserRole) => void;
  clearError: () => void;
}

const AppealContext = createContext<AppealContextType | undefined>(undefined);

export const AppealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [summary, setSummary] = useState<AppealSummary>({
    todayPending: 0,
    overdueCount: 0,
    returnedCount: 0,
    totalAppeals: 0,
    resolvedCount: 0,
  });
  const [currentUserId, setCurrentUserId] = useState<string>('u2');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('inspector');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const fetchAppeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/appeals');
      const result: ApiResponse<Appeal[]> = await response.json();
      if (result.success && result.data) {
        setAppeals(result.data);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError({ code: 'NETWORK_ERROR', message: '网络请求失败' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/appeals/summary');
      const result: ApiResponse<AppealSummary> = await response.json();
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const handleAppealAction = useCallback(async (request: HandleAppealRequest) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appeals/${request.appealId}/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: request.action,
          comment: request.comment,
          resolutionAmount: request.resolutionAmount,
          actorId: request.actorId,
          actorName: request.actorName,
          actorRole: request.actorRole,
        }),
      });
      const result: ApiResponse<{ appeal: Appeal; auditLog: AuditLog }> = await response.json();
      if (result.success && result.data) {
        const { appeal, auditLog } = result.data;
        setAppeals(prev => prev.map(a => a.id === appeal.id ? appeal : a));
        if (selectedAppeal?.id === appeal.id) {
          setSelectedAppeal(appeal);
        }
        await fetchSummary();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError({ code: 'NETWORK_ERROR', message: '网络请求失败' });
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络请求失败' } };
    } finally {
      setIsLoading(false);
    }
  }, [selectedAppeal, fetchSummary]);

  const getEvidences = useCallback(async (appealId: string) => {
    try {
      const response = await fetch(`/api/appeals/${appealId}/evidences`);
      const result: ApiResponse<Evidence[]> = await response.json();
      return result.data || [];
    } catch (err) {
      console.error('Failed to fetch evidences:', err);
      return [];
    }
  }, []);

  const getAuditLogs = useCallback(async (appealId: string) => {
    try {
      const response = await fetch(`/api/appeals/${appealId}/logs`);
      const result: ApiResponse<AuditLog[]> = await response.json();
      return result.data || [];
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      return [];
    }
  }, []);

  const setCurrentUser = useCallback((userId: string, role: UserRole) => {
    setCurrentUserId(userId);
    setCurrentUserRole(role);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchAppeals();
    fetchSummary();
  }, [fetchAppeals, fetchSummary]);

  const value: AppealContextType = {
    appeals,
    selectedAppeal,
    summary,
    currentUserId,
    currentUserRole,
    isLoading,
    error,
    setSelectedAppeal,
    fetchAppeals,
    fetchSummary,
    handleAppeal: handleAppealAction,
    getEvidences,
    getAuditLogs,
    setCurrentUser,
    clearError,
  };

  return (
    <AppealContext.Provider value={value}>
      {children}
    </AppealContext.Provider>
  );
};

export const useAppealContext = () => {
  const context = useContext(AppealContext);
  if (!context) {
    throw new Error('useAppealContext must be used within an AppealProvider');
  }
  return context;
};

export const useAppealList = () => {
  const { appeals, isLoading, error, fetchAppeals } = useAppealContext();
  return { appeals, isLoading, error, fetchAppeals };
};

export const useAppealDetail = () => {
  const { 
    selectedAppeal, 
    setSelectedAppeal, 
    handleAppeal, 
    getEvidences, 
    getAuditLogs,
    currentUserId,
    currentUserRole,
    isLoading 
  } = useAppealContext();
  
  const canHandle = selectedAppeal 
    ? ROLE_ALLOWED_STATUS[currentUserRole].includes(selectedAppeal.status) && 
      (!selectedAppeal.assignedTo || selectedAppeal.assignedTo === currentUserId)
    : false;
  
  return {
    selectedAppeal,
    setSelectedAppeal,
    handleAppeal,
    getEvidences,
    getAuditLogs,
    currentUserId,
    currentUserRole,
    isLoading,
    canHandle,
  };
};

export const useAppealSummary = () => {
  const { summary, fetchSummary } = useAppealContext();
  return { summary, fetchSummary };
};

export const useCurrentUser = () => {
  const { currentUserId, currentUserRole, setCurrentUser } = useAppealContext();
  const roleOptions: { id: string; role: UserRole; label: string }[] = [
    { id: 'u1', role: 'receiver', label: '收货员 - 王收货' },
    { id: 'u2', role: 'inspector', label: '检测师 - 李检测' },
    { id: 'u3', role: 'finance', label: '财务 - 张财务' },
    { id: 'u4', role: 'admin', label: '管理员 - 赵管理员' },
  ];
  const currentOption = roleOptions.find(r => r.id === currentUserId);
  
  return {
    userId: currentUserId,
    role: currentUserRole,
    name: currentOption?.label.split(' - ')[1] || '未知用户',
    roleOptions,
    setCurrentUser,
  };
};