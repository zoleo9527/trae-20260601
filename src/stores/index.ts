import { create } from 'zustand';
import { Role, Appeal, OperationHistory, Attachment, AppealStatus, OperationType } from '../types';
import { loadData, saveData, generateId, generateAppealNumber } from '../utils/storage';
import { differenceInHours } from 'date-fns';

interface RoleStore {
  currentRole: Role;
  currentUserName: string;
  switchRole: (role: Role) => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  currentRole: 'receptionist',
  currentUserName: '张三',
  switchRole: (role) => {
    const names: Record<Role, string> = {
      receptionist: '张三',
      professional: '李工',
      supervisor: '赵总'
    };
    set({ currentRole: role, currentUserName: names[role] });
  }
}));

interface AppealStore {
  appeals: Appeal[];
  operationHistory: OperationHistory[];
  attachments: Attachment[];
  
  loadAppeals: () => void;
  getAppealById: (id: string) => Appeal | undefined;
  getOperationHistoryByAppealId: (appealId: string) => OperationHistory[];
  getAttachmentsByAppealId: (appealId: string) => Attachment[];
  
  getTodoList: (role: Role) => Appeal[];
  getExceptionList: () => Appeal[];
  
  createAppeal: (appeal: Omit<Appeal, 'id' | 'appealNumber'>, attachments?: { fileName: string; fileUrl: string }[]) => void;
  updateAppeal: (id: string, updates: Partial<Appeal>) => void;
  addOperation: (operation: Omit<OperationHistory, 'id' | 'operationTime'>) => void;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadTime'>) => void;
  
  resetData: () => void;
}

export const useAppealStore = create<AppealStore>((set, get) => ({
  appeals: [],
  operationHistory: [],
  attachments: [],
  
  loadAppeals: () => {
    const data = loadData();
    set(data);
  },
  
  getAppealById: (id) => {
    return get().appeals.find(a => a.id === id);
  },
  
  getOperationHistoryByAppealId: (appealId) => {
    return get().operationHistory.filter(o => o.appealId === appealId).sort((a, b) => 
      b.operationTime.getTime() - a.operationTime.getTime()
    );
  },
  
  getAttachmentsByAppealId: (appealId) => {
    return get().attachments.filter(a => a.appealId === appealId);
  },
  
  getTodoList: (role) => {
    const appeals = get().appeals;
    switch (role) {
      case 'receptionist':
        return appeals.filter(a => a.status === 'pending_assignment');
      case 'professional':
        return appeals.filter(a => 
          a.status === 'pending_investigation' || a.status === 'returned'
        );
      case 'supervisor':
        return appeals.filter(a => a.status === 'pending_review');
      default:
        return [];
    }
  },
  
  getExceptionList: () => {
    const appeals = get().appeals;
    return appeals.filter(a => {
      if (a.isException) return true;
      
      const hours = differenceInHours(new Date(), a.updatedAt);
      if (hours > 24 && a.status !== 'archived') {
        return true;
      }
      
      const returnCount = get().operationHistory.filter(
        o => o.appealId === a.id && o.operationType === 'return'
      ).length;
      if (returnCount >= 2) {
        return true;
      }
      
      return false;
    });
  },
  
  createAppeal: (appealData, attachments: { fileName: string; fileUrl: string }[] = []) => {
    const appeal: Appeal = {
      ...appealData,
      id: generateId(),
      appealNumber: generateAppealNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isException: false
    };
    
    const operation: OperationHistory = {
      id: generateId(),
      appealId: appeal.id,
      operatorRole: useRoleStore.getState().currentRole,
      operatorName: useRoleStore.getState().currentUserName,
      operationType: 'create',
      operationContent: '录入客户申诉信息',
      operationTime: new Date()
    };
    
    const newAttachments: Attachment[] = attachments.map(file => ({
      id: generateId(),
      appealId: appeal.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      uploadedBy: useRoleStore.getState().currentUserName,
      uploadTime: new Date()
    }));
    
    set((state) => ({
      appeals: [...state.appeals, appeal],
      operationHistory: [...state.operationHistory, operation],
      attachments: [...state.attachments, ...newAttachments]
    }));
    
    saveData({
      appeals: get().appeals,
      operationHistory: get().operationHistory,
      attachments: get().attachments
    });
  },
  
  updateAppeal: (id, updates) => {
    set((state) => ({
      appeals: state.appeals.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      )
    }));
    
    saveData({
      appeals: get().appeals,
      operationHistory: get().operationHistory,
      attachments: get().attachments
    });
  },
  
  addOperation: (operationData) => {
    const operation: OperationHistory = {
      ...operationData,
      id: generateId(),
      operationTime: new Date()
    };
    
    set((state) => ({
      operationHistory: [...state.operationHistory, operation]
    }));
    
    saveData({
      appeals: get().appeals,
      operationHistory: get().operationHistory,
      attachments: get().attachments
    });
  },
  
  addAttachment: (attachmentData) => {
    const attachment: Attachment = {
      ...attachmentData,
      id: generateId(),
      uploadTime: new Date()
    };
    
    set((state) => ({
      attachments: [...state.attachments, attachment]
    }));
    
    saveData({
      appeals: get().appeals,
      operationHistory: get().operationHistory,
      attachments: get().attachments
    });
  },
  
  resetData: () => {
    const data = loadData();
    set(data);
  }
}));

interface WorkflowStore {
  assignProfessional: (appealId: string, professionalName: string) => void;
  submitInvestigation: (appealId: string, siteRecord: string, opinion: string, attachments?: { fileName: string; fileUrl: string }[]) => void;
  approveAppeal: (appealId: string, conclusion: string) => void;
  returnAppeal: (appealId: string, reason: string) => void;
  supplementMaterial: (appealId: string, note: string, siteRecord?: string, opinion?: string, attachments?: { fileName: string; fileUrl: string }[]) => void;
}

export const useWorkflowStore = create<WorkflowStore>(() => ({
  assignProfessional: (appealId, professionalName) => {
    const { updateAppeal, addOperation } = useAppealStore.getState();
    const { currentRole, currentUserName } = useRoleStore.getState();
    
    updateAppeal(appealId, {
      status: 'pending_investigation',
      assignedProfessional: professionalName
    });
    
    addOperation({
      appealId,
      operatorRole: currentRole,
      operatorName: currentUserName,
      operationType: 'assign',
      operationContent: `分配专业人员:${professionalName}`
    });
  },
  
  submitInvestigation: (appealId, siteRecord, opinion, attachments) => {
    const { updateAppeal, addOperation, addAttachment } = useAppealStore.getState();
    const { currentRole, currentUserName } = useRoleStore.getState();
    
    updateAppeal(appealId, {
      status: 'pending_review',
      siteRecord,
      professionalOpinion: opinion,
      isException: false,
      exceptionReason: undefined
    });
    
    addOperation({
      appealId,
      operatorRole: currentRole,
      operatorName: currentUserName,
      operationType: 'submit_investigation',
      operationContent: '提交现场核查结果和专业意见'
    });
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        addAttachment({
          appealId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          uploadedBy: currentUserName
        });
      });
    }
  },
  
  approveAppeal: (appealId, conclusion) => {
    const { updateAppeal, addOperation } = useAppealStore.getState();
    const { currentRole, currentUserName } = useRoleStore.getState();
    
    updateAppeal(appealId, {
      status: 'approved',
      reviewConclusion: conclusion
    });
    
    addOperation({
      appealId,
      operatorRole: currentRole,
      operatorName: currentUserName,
      operationType: 'approve',
      operationContent: `复核通过:${conclusion}`
    });
    
    setTimeout(() => {
      updateAppeal(appealId, { status: 'archived' });
    }, 5000);
  },
  
  returnAppeal: (appealId, reason) => {
    const { updateAppeal, addOperation } = useAppealStore.getState();
    const { currentRole, currentUserName } = useRoleStore.getState();
    
    updateAppeal(appealId, {
      status: 'returned',
      returnReason: reason,
      isException: true,
      exceptionReason: '已退回,需要补充材料'
    });
    
    addOperation({
      appealId,
      operatorRole: currentRole,
      operatorName: currentUserName,
      operationType: 'return',
      operationContent: '退回重新核查',
      reason
    });
  },
  
  supplementMaterial: (appealId, note, siteRecord, opinion, attachments) => {
    const { updateAppeal, addOperation, addAttachment } = useAppealStore.getState();
    const { currentRole, currentUserName } = useRoleStore.getState();
    
    const updates: Partial<Appeal> = {
      status: 'pending_review',
      supplementNote: note,
      isException: false,
      exceptionReason: undefined
    };
    
    if (siteRecord) updates.siteRecord = siteRecord;
    if (opinion) updates.professionalOpinion = opinion;
    
    updateAppeal(appealId, updates);
    
    addOperation({
      appealId,
      operatorRole: currentRole,
      operatorName: currentUserName,
      operationType: 'supplement',
      operationContent: '补充材料'
    });
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        addAttachment({
          appealId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          uploadedBy: currentUserName
        });
      });
    }
  }
}));