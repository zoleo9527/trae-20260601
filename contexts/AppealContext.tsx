import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  Appeal, 
  Evidence, 
  AuditLog, 
  AppealSummary, 
  UserRole,
  APPEAL_STATUS_MAP
} from '../types';
import { 
  appealService, 
  HandleAppealRequest, 
  UploadEvidenceRequest,
  ApiResponse 
} from '../services/appealService';

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
  uploadEvidence: (request: UploadEvidenceRequest) => Promise<ApiResponse<{ evidence: Evidence; auditLog: AuditLog }>>;
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
      const response = await appealService.getAppeals();
      if (response.success && response.data) {
        setAppeals(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError({ code: 'NETWORK_ERROR', message: '网络请求失败' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await appealService.getSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const handleAppealAction = useCallback(async (request: HandleAppealRequest) => {
    setIsLoading(true);
    try {
      const response = await appealService.handleAppeal(request);
      if (response.success && response.data) {
        const { appeal, auditLog } = response.data;
        setAppeals(prev => prev.map(a => a.id === appeal.id ? appeal : a));
        if (selectedAppeal?.id === appeal.id) {
          setSelectedAppeal(appeal);
        }
        await fetchSummary();
      } else if (response.error) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      setError({ code: 'NETWORK_ERROR', message: '网络请求失败' });
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络请求失败' } };
    } finally {
      setIsLoading(false);
    }
  }, [selectedAppeal, fetchSummary]);

  const uploadEvidenceAction = useCallback(async (request: UploadEvidenceRequest) => {
    setIsLoading(true);
    try {
      const response = await appealService.uploadEvidence(request);
      if (response.success && response.data) {
        const { evidence, auditLog } = response.data;
        setAppeals(prev => prev.map(a => 
          a.id === evidence.appealId 
            ? { ...a, evidenceIds: [...a.evidenceIds, evidence.id], updatedAt: new Date().toISOString() }
            : a
        ));
        if (selectedAppeal?.id === evidence.appealId) {
          setSelectedAppeal(prev => prev ? {
            ...prev,
            evidenceIds: [...prev.evidenceIds, evidence.id],
            updatedAt: new Date().toISOString(),
          } : null);
        }
      } else if (response.error) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      setError({ code: 'NETWORK_ERROR', message: '网络请求失败' });
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络请求失败' } };
    } finally {
      setIsLoading(false);
    }
  }, [selectedAppeal]);

  const getEvidences = useCallback(async (appealId: string) => {
    const response = await appealService.getEvidencesByAppealId(appealId);
    return response.data || [];
  }, []);

  const getAuditLogs = useCallback(async (appealId: string) => {
    const response = await appealService.getAuditLogsByAppealId(appealId);
    return response.data || [];
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
    uploadEvidence: uploadEvidenceAction,
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
  
  return {
    selectedAppeal,
    setSelectedAppeal,
    handleAppeal,
    getEvidences,
    getAuditLogs,
    currentUserId,
    currentUserRole,
    isLoading,
  };
};

export const useAppealSummary = () => {
  const { summary, fetchSummary } = useAppealContext();
  return { summary, fetchSummary };
};

export const useCurrentUser = () => {
  const { currentUserId, currentUserRole, setCurrentUser } = useAppealContext();
  const user = appealService.getUserById(currentUserId);
  return {
    userId: currentUserId,
    role: currentUserRole,
    name: user?.name || '未知用户',
    setCurrentUser,
  };
};