import { create } from 'zustand';
import type { User, Elder, Bed, FamilyMember, VisitAppointment, CommunicationRecord, UserRole, VisitStatus, CommunicationStatus, StatusHistoryItem } from '../types';
import { mockUsers, mockElders, mockBeds, mockFamilyMembers, mockVisitAppointments, mockCommunications } from '../data/mockData';
import { generateIdempotencyKey, checkIdempotency, storeIdempotencyResult } from '../utils/idempotent';
import { hasPermission } from '../utils/permissions';

interface AppState {
  currentUser: User | null;
  users: User[];
  elders: Elder[];
  beds: Bed[];
  familyMembers: FamilyMember[];
  visitAppointments: VisitAppointment[];
  communications: CommunicationRecord[];
  isLoading: boolean;
  error: string | null;

  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;

  createVisitAppointment: (data: Omit<VisitAppointment, 'id' | 'requestId' | 'status' | 'statusHistory' | 'createdAt' | 'isIdempotent'>, idempotencyKey?: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;
  updateVisitStatus: (visitId: string, newStatus: VisitStatus, remark?: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;
  approveVisit: (visitId: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;
  rejectVisit: (visitId: string, reason: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;
  checkInVisit: (visitId: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;
  checkOutVisit: (visitId: string) => Promise<{ success: boolean; data?: VisitAppointment; error?: string }>;

  createCommunication: (data: Omit<CommunicationRecord, 'id' | 'requestId' | 'status' | 'statusHistory' | 'createdAt' | 'isIdempotent'>, idempotencyKey?: string) => Promise<{ success: boolean; data?: CommunicationRecord; error?: string }>;
  updateCommunicationStatus: (commId: string, newStatus: CommunicationStatus, remark?: string, resolution?: string) => Promise<{ success: boolean; data?: CommunicationRecord; error?: string }>;
  assignCommunication: (commId: string, assigneeId: string) => Promise<{ success: boolean; data?: CommunicationRecord; error?: string }>;

  getVisitsByElderId: (elderId: string) => VisitAppointment[];
  getCommunicationsByElderId: (elderId: string) => CommunicationRecord[];
  getVisitsByCurrentUser: () => VisitAppointment[];
  getCommunicationsByCurrentUser: () => CommunicationRecord[];
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  elders: mockElders,
  beds: mockBeds,
  familyMembers: mockFamilyMembers,
  visitAppointments: mockVisitAppointments,
  communications: mockCommunications,
  isLoading: false,
  error: null,

  setCurrentUser: (user: User) => set({ currentUser: user }),

  switchRole: (role: UserRole) => {
    const users = get().users;
    const user = users.find(u => u.role === role);
    if (user) {
      set({ currentUser: user });
    }
  },

  createVisitAppointment: async (data, idempotencyKey) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: '请先登录' };
    if (!hasPermission(currentUser.role, 'canCreateVisit')) {
      return { success: false, error: '您没有创建预约的权限' };
    }

    const key = idempotencyKey || generateIdempotencyKey();
    const cached = checkIdempotency(key);
    if (cached.exists) {
      return { success: true, data: cached.result as VisitAppointment };
    }

    const newVisit: VisitAppointment = {
      ...data,
      id: `visit_${Date.now()}`,
      requestId: `REQ_VISIT_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(get().visitAppointments.length + 1).padStart(3, '0')}`,
      status: 'pending_approval',
      statusHistory: [{
        status: 'pending_approval',
        timestamp: new Date().toISOString(),
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        remark: '提交预约申请',
      }],
      createdAt: new Date().toISOString(),
      isIdempotent: true,
    };

    set(state => ({
      visitAppointments: [...state.visitAppointments, newVisit],
    }));

    storeIdempotencyResult(key, newVisit);
    return { success: true, data: newVisit };
  },

  updateVisitStatus: async (visitId, newStatus, remark) => {
    const { currentUser, visitAppointments } = get();
    if (!currentUser) return { success: false, error: '请先登录' };

    const visit = visitAppointments.find(v => v.id === visitId);
    if (!visit) return { success: false, error: '预约不存在' };

    const canUpdate = 
      currentUser.role === 'nurse_manager' ||
      (currentUser.role === 'primary_nurse' && visit.status === 'checked_in') ||
      (currentUser.role === 'family' && visit.createdBy === currentUser.id && ['pending_approval', 'approved'].includes(visit.status));

    if (!canUpdate) {
      return { success: false, error: '您没有权限修改此预约状态' };
    }

    const historyItem: StatusHistoryItem = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      remark,
    };

    const updatedVisit: VisitAppointment = {
      ...visit,
      status: newStatus,
      statusHistory: [...visit.statusHistory, historyItem],
      lastUpdatedBy: currentUser.id,
      lastUpdatedAt: new Date().toISOString(),
    };

    if (newStatus === 'approved') {
      updatedVisit.approvedBy = currentUser.id;
      updatedVisit.approvedAt = new Date().toISOString();
    }

    set(state => ({
      visitAppointments: state.visitAppointments.map(v => 
        v.id === visitId ? updatedVisit : v
      ),
    }));

    return { success: true, data: updatedVisit };
  },

  approveVisit: async (visitId) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: '请先登录' };
    if (!hasPermission(currentUser.role, 'canApproveVisit')) {
      return { success: false, error: '您没有审批权限' };
    }
    return get().updateVisitStatus(visitId, 'approved', '审核通过');
  },

  rejectVisit: async (visitId, reason) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: '请先登录' };
    if (!hasPermission(currentUser.role, 'canApproveVisit')) {
      return { success: false, error: '您没有审批权限' };
    }
    
    const result = await get().updateVisitStatus(visitId, 'rejected', reason);
    if (result.success && result.data) {
      set(state => ({
        visitAppointments: state.visitAppointments.map(v =>
          v.id === visitId ? { ...v, rejectedReason: reason } : v
        ),
      }));
    }
    return result;
  },

  checkInVisit: async (visitId) => {
    const result = await get().updateVisitStatus(visitId, 'checked_in', '访客已签到');
    if (result.success && result.data) {
      set(state => ({
        visitAppointments: state.visitAppointments.map(v =>
          v.id === visitId ? { ...v, checkInAt: new Date().toISOString() } : v
        ),
      }));
    }
    return result;
  },

  checkOutVisit: async (visitId) => {
    const result = await get().updateVisitStatus(visitId, 'completed', '探视结束，访客已离开');
    if (result.success && result.data) {
      set(state => ({
        visitAppointments: state.visitAppointments.map(v =>
          v.id === visitId ? { ...v, checkOutAt: new Date().toISOString() } : v
        ),
      }));
    }
    return result;
  },

  createCommunication: async (data, idempotencyKey) => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: '请先登录' };
    if (!hasPermission(currentUser.role, 'canCreateCommunication')) {
      return { success: false, error: '您没有创建沟通记录的权限' };
    }

    const key = idempotencyKey || generateIdempotencyKey();
    const cached = checkIdempotency(key);
    if (cached.exists) {
      return { success: true, data: cached.result as CommunicationRecord };
    }

    const newComm: CommunicationRecord = {
      ...data,
      id: `comm_${Date.now()}`,
      requestId: `REQ_COMM_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(get().communications.length + 1).padStart(3, '0')}`,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        remark: '发起沟通',
      }],
      createdAt: new Date().toISOString(),
      isIdempotent: true,
    };

    set(state => ({
      communications: [...state.communications, newComm],
    }));

    storeIdempotencyResult(key, newComm);
    return { success: true, data: newComm };
  },

  updateCommunicationStatus: async (commId, newStatus, remark, resolution) => {
    const { currentUser, communications } = get();
    if (!currentUser) return { success: false, error: '请先登录' };

    const comm = communications.find(c => c.id === commId);
    if (!comm) return { success: false, error: '沟通记录不存在' };

    const canUpdate = 
      currentUser.role === 'nurse_manager' ||
      comm.assignedTo === currentUser.id ||
      comm.createdBy === currentUser.id;

    if (!canUpdate) {
      return { success: false, error: '您没有权限修改此沟通记录' };
    }

    const historyItem: StatusHistoryItem = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      remark,
    };

    const updatedComm: CommunicationRecord = {
      ...comm,
      status: newStatus,
      statusHistory: [...comm.statusHistory, historyItem],
      lastUpdatedBy: currentUser.id,
      lastUpdatedAt: new Date().toISOString(),
      ...(newStatus === 'completed' ? { completedAt: new Date().toISOString(), resolution } : {}),
    };

    set(state => ({
      communications: state.communications.map(c =>
        c.id === commId ? updatedComm : c
      ),
    }));

    return { success: true, data: updatedComm };
  },

  assignCommunication: async (commId, assigneeId) => {
    const { currentUser, communications, users } = get();
    if (!currentUser) return { success: false, error: '请先登录' };
    if (!hasPermission(currentUser.role, 'canAssignCommunication')) {
      return { success: false, error: '您没有分配权限' };
    }

    const comm = communications.find(c => c.id === commId);
    if (!comm) return { success: false, error: '沟通记录不存在' };

    const assignee = users.find(u => u.id === assigneeId);
    if (!assignee) return { success: false, error: '被分配人不存在' };

    const historyItem: StatusHistoryItem = {
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      remark: `分配给 ${assignee.name} 处理`,
    };

    const updatedComm: CommunicationRecord = {
      ...comm,
      status: 'in_progress',
      assignedTo: assigneeId,
      assignedAt: new Date().toISOString(),
      statusHistory: [...comm.statusHistory, historyItem],
      lastUpdatedBy: currentUser.id,
      lastUpdatedAt: new Date().toISOString(),
    };

    set(state => ({
      communications: state.communications.map(c =>
        c.id === commId ? updatedComm : c
      ),
    }));

    return { success: true, data: updatedComm };
  },

  getVisitsByElderId: (elderId) => {
    return get().visitAppointments.filter(v => v.elderId === elderId);
  },

  getCommunicationsByElderId: (elderId) => {
    return get().communications.filter(c => c.elderId === elderId);
  },

  getVisitsByCurrentUser: () => {
    const { currentUser, visitAppointments, elders } = get();
    if (!currentUser) return [];
    
    if (currentUser.role === 'nurse_manager' || hasPermission(currentUser.role, 'canViewAllVisits')) {
      return visitAppointments;
    }
    
    if (currentUser.role === 'primary_nurse') {
      const myElders = elders.filter(e => e.primaryNurseId === currentUser.id).map(e => e.id);
      return visitAppointments.filter(v => myElders.includes(v.elderId));
    }

    return visitAppointments.filter(v => v.createdBy === currentUser.id);
  },

  getCommunicationsByCurrentUser: () => {
    const { currentUser, communications, elders } = get();
    if (!currentUser) return [];
    
    if (currentUser.role === 'nurse_manager' || hasPermission(currentUser.role, 'canViewAllCommunications')) {
      return communications;
    }
    
    if (currentUser.role === 'primary_nurse' || currentUser.role === 'social_worker') {
      const myElders = elders.filter(e => e.primaryNurseId === currentUser.id).map(e => e.id);
      return communications.filter(c => 
        myElders.includes(c.elderId) || 
        c.assignedTo === currentUser.id ||
        c.createdBy === currentUser.id
      );
    }

    return communications.filter(c => c.createdBy === currentUser.id);
  },
}));
