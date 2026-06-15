import { create } from 'zustand';
import { UserRole, UserInfo, ColorLock, InventoryReservation, SampleBook, MeasureOrder, ReplenishRequest, Remark } from '../types';
import { mockUsers, mockColorLocks, mockInventoryReservations, mockSampleBooks, mockMeasureOrders, mockReplenishRequests } from '../data/mockData';

interface AppState {
  currentUser: UserInfo | null;
  colorLocks: ColorLock[];
  reservations: InventoryReservation[];
  sampleBooks: SampleBook[];
  measureOrders: MeasureOrder[];
  replenishRequests: ReplenishRequest[];
  
  setCurrentUser: (user: UserInfo) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  
  addColorLock: (lock: Omit<ColorLock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateColorLock: (id: string, updates: Partial<ColorLock>) => void;
  addRemarkToLock: (lockId: string, remark: Omit<Remark, 'id' | 'createdAt'>) => void;
  
  addReservation: (reservation: Omit<InventoryReservation, 'id' | 'createdAt' | 'updatedAt'>) => InventoryReservation;
  updateReservation: (id: string, updates: Partial<InventoryReservation>) => void;
  addRemarkToReservation: (reservationId: string, remark: Omit<Remark, 'id' | 'createdAt'>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  colorLocks: mockColorLocks,
  reservations: mockInventoryReservations,
  sampleBooks: mockSampleBooks,
  measureOrders: mockMeasureOrders,
  replenishRequests: mockReplenishRequests,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  login: (role) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      set({ currentUser: user });
    }
  },
  
  logout: () => set({ currentUser: null }),
  
  addColorLock: (lock) => {
    const newLock: ColorLock = {
      ...lock,
      id: `CL${String(Date.now()).slice(-3)}`,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
    };
    set((state) => ({ colorLocks: [...state.colorLocks, newLock] }));
  },
  
  updateColorLock: (id, updates) => {
    set((state) => ({
      colorLocks: state.colorLocks.map((lock) =>
        lock.id === id ? { ...lock, ...updates, updatedAt: new Date().toLocaleString('zh-CN') } : lock
      ),
    }));
  },
  
  addRemarkToLock: (lockId, remark) => {
    const newRemark: Remark = {
      ...remark,
      id: `R${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    set((state) => {
      const lock = state.colorLocks.find(l => l.id === lockId);
      const hasReservation = lock?.linkedReservationId;
      
      return {
        colorLocks: state.colorLocks.map((lock) =>
          lock.id === lockId
            ? { ...lock, remarks: [...lock.remarks, newRemark], updatedAt: new Date().toLocaleString('zh-CN') }
            : lock
        ),
        reservations: hasReservation 
          ? state.reservations.map((res) =>
              res.id === hasReservation
                ? { ...res, remarks: [...res.remarks, newRemark], updatedAt: new Date().toLocaleString('zh-CN') }
                : res
            )
          : state.reservations,
      };
    });
  },
  
  syncLockToReservation: (lockId: string, reservationId: string) => {
    set((state) => {
      const lock = state.colorLocks.find(l => l.id === lockId);
      if (!lock) return state;
      
      return {
        reservations: state.reservations.map((res) =>
          res.id === reservationId
            ? { 
                ...res, 
                responsibilityFlag: lock.responsibilityFlag,
                updatedAt: new Date().toLocaleString('zh-CN') 
              }
            : res
        ),
      };
    });
  },
  
  addReservation: (reservation) => {
    const newReservation: InventoryReservation = {
      ...reservation,
      id: `IR${String(Date.now()).slice(-3)}`,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
    };
    set((state) => ({ reservations: [...state.reservations, newReservation] }));
    return newReservation;
  },
  
  updateReservation: (id, updates) => {
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, ...updates, updatedAt: new Date().toLocaleString('zh-CN') } : res
      ),
    }));
  },
  
  addRemarkToReservation: (reservationId, remark) => {
    const newRemark: Remark = {
      ...remark,
      id: `R${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === reservationId
          ? { ...res, remarks: [...res.remarks, newRemark], updatedAt: new Date().toLocaleString('zh-CN') }
          : res
      ),
    }));
  },
}));
