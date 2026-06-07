import { create } from 'zustand';
import { Anomaly, AnomalyType, AnomalySeverity, AnomalyStatus } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockAnomalies } from '../data/mockData';
import { useAuditStore } from './auditStore';
import { useAuthStore } from './authStore';
import { useBookingStore } from './bookingStore';
import { usePackageStore } from './packageStore';
import { useMemberStore } from './memberStore';

interface AnomalyStore {
  anomalies: Anomaly[];
  addAnomaly: (
    type: AnomalyType,
    severity: AnomalySeverity,
    description: string,
    relatedBookingId?: string,
    relatedEntityId?: string
  ) => string;
  updateAnomalyStatus: (id: string, status: AnomalyStatus, handlingNote?: string) => void;
  getAnomalyById: (id: string) => Anomaly | undefined;
  getOpenAnomalies: () => Anomaly[];
  getAnomaliesByType: (type: AnomalyType) => Anomaly[];
  getAnomaliesBySeverity: (severity: AnomalySeverity) => Anomaly[];
  getAnomaliesByBookingId: (bookingId: string) => Anomaly[];
  getAnomaliesByMemberId: (memberId: string) => Anomaly[];
  getAnomaliesByOrderId: (orderId: string) => Anomaly[];
  detectRoomConflicts: () => void;
  detectDrinkGiftIssues: () => void;
  detectMemberBalanceIssues: () => void;
  runAllChecks: () => void;
  getAnomalyCount: () => { high: number; medium: number; low: number };
}

const initialAnomalies = storage.get<Anomaly[]>('anomalies', mockAnomalies);

export const useAnomalyStore = create<AnomalyStore>((set, get) => ({
  anomalies: initialAnomalies,
  
  addAnomaly: (type, severity, description, relatedBookingId, relatedEntityId) => {
    const existing = get().anomalies.find(
      (a) => a.type === type && 
             a.relatedEntityId === relatedEntityId && 
             a.status !== 'resolved' && 
             a.status !== 'ignored'
    );
    
    if (existing) return existing.id;
    
    const anomaly: Anomaly = {
      id: generateId(),
      type,
      severity,
      status: 'open',
      description,
      relatedBookingId,
      relatedEntityId,
      createdAt: new Date().toISOString(),
    };
    
    const anomalies = [...get().anomalies, anomaly];
    set({ anomalies });
    storage.set('anomalies', anomalies);
    
    return anomaly.id;
  },
  
  updateAnomalyStatus: (id, status, handlingNote) => {
    const now = new Date().toISOString();
    const anomalies = get().anomalies.map((a) => {
      if (a.id === id) {
        const beforeData = { status: a.status };
        const updated: Anomaly = {
          ...a,
          status,
          handledBy: useAuthStore.getState().currentUser,
          handlingNote,
          handledAt: now,
        };
        
        useAuditStore.getState().addLog(
          'anomaly',
          id,
          'status_change',
          beforeData,
          { status, handlingNote },
          handlingNote
        );
        
        return updated;
      }
      return a;
    });
    set({ anomalies });
    storage.set('anomalies', anomalies);
  },
  
  getAnomalyById: (id) => {
    return get().anomalies.find((a) => a.id === id);
  },
  
  getOpenAnomalies: () => {
    return get().anomalies.filter((a) => a.status === 'open' || a.status === 'handling')
      .sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  },
  
  getAnomaliesByType: (type) => {
    return get().anomalies.filter((a) => a.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getAnomaliesBySeverity: (severity) => {
    return get().anomalies.filter((a) => a.severity === severity)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getAnomaliesByBookingId: (bookingId) => {
    return get().anomalies.filter((a) =>
      a.relatedBookingId === bookingId || a.relatedEntityId === bookingId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getAnomaliesByMemberId: (memberId) => {
    return get().anomalies.filter((a) =>
      a.type === 'member_balance_issue' && a.relatedEntityId === memberId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getAnomaliesByOrderId: (orderId) => {
    return get().anomalies.filter((a) =>
      a.type === 'drink_gift_issue' && a.relatedEntityId === orderId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  detectRoomConflicts: () => {
    const { rooms, bookings } = useBookingStore.getState();
    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
    
    rooms.forEach((room) => {
      const roomBookings = activeBookings
        .filter((b) => b.roomNumber === room.number)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      for (let i = 0; i < roomBookings.length; i++) {
        for (let j = i + 1; j < roomBookings.length; j++) {
          const b1 = roomBookings[i];
          const b2 = roomBookings[j];
          
          const start1 = new Date(b1.startTime).getTime();
          const end1 = new Date(b1.endTime).getTime();
          const start2 = new Date(b2.startTime).getTime();
          const end2 = new Date(b2.endTime).getTime();
          
          if (start1 < end2 && end1 > start2) {
            get().addAnomaly(
              'room_conflict',
              'high',
              `包厢${room.number}在时段重叠：${b1.customerName}与${b2.customerName}`,
              b2.id,
              b2.id
            );
          }
        }
      }
    });
  },
  
  detectDrinkGiftIssues: () => {
    const { packageOrders, packages, validateDrinkGifts } = usePackageStore.getState();
    
    packageOrders.forEach((order) => {
      const pkg = packages.find((p) => p.id === order.packageId);
      if (!pkg) return;
      
      const { valid, issues } = validateDrinkGifts(order.packageId, order.drinkGifts);
      if (!valid) {
        get().addAnomaly(
          'drink_gift_issue',
          'medium',
          `订单${order.id}酒水赠送异常：${issues.join('；')}`,
          order.bookingId,
          order.id
        );
      }
    });
  },
  
  detectMemberBalanceIssues: () => {
    const { members, checkBalanceConsistency } = useMemberStore.getState();
    
    members.forEach((member) => {
      const { consistent, diff } = checkBalanceConsistency(member.id);
      if (!consistent) {
        get().addAnomaly(
          'member_balance_issue',
          Math.abs(diff) > 100 ? 'high' : 'low',
          `会员${member.name}余额不一致，差额：¥${diff.toFixed(2)}`,
          undefined,
          member.id
        );
      }
    });
  },
  
  runAllChecks: () => {
    get().detectRoomConflicts();
    get().detectDrinkGiftIssues();
    get().detectMemberBalanceIssues();
  },
  
  getAnomalyCount: () => {
    const open = get().getOpenAnomalies();
    return {
      high: open.filter((a) => a.severity === 'high').length,
      medium: open.filter((a) => a.severity === 'medium').length,
      low: open.filter((a) => a.severity === 'low').length,
    };
  },
}));
