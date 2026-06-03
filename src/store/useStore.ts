import { create } from 'zustand';
import type { Landlord, Property, Order, Expense, Repair, Advance, Bill, Dispute } from '../../shared/types';
import { landlords, properties, orders, expenses, repairs, advances, bills, disputes } from '../data/mockData';
import { api } from '../utils/api';

interface AppState {
  currentRole: 'operator' | 'finance' | 'landlord';
  currentLandlordId: string;
  landlords: Landlord[];
  properties: Property[];
  orders: Order[];
  expenses: Expense[];
  repairs: Repair[];
  advances: Advance[];
  bills: Bill[];
  disputes: Dispute[];
  setCurrentRole: (role: 'operator' | 'finance' | 'landlord') => void;
  setCurrentLandlordId: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addRepair: (repair: Omit<Repair, 'id'>) => Promise<void>;
  addAdvance: (advance: Omit<Advance, 'id'>) => Promise<void>;
  addBill: (propertyId: string, year: number, month: number) => Promise<void>;
  addDispute: (dispute: Omit<Dispute, 'id' | 'messages'>) => Promise<void>;
  addDisputeMessage: (disputeId: string, sender: 'landlord' | 'operator', content: string) => Promise<void>;
  resolveDispute: (id: string, status: 'resolved' | 'rejected', resolution: string) => Promise<void>;
  updateBillStatus: (id: string, status: Bill['status']) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  currentRole: 'operator',
  currentLandlordId: 'l1',
  landlords,
  properties,
  orders,
  expenses,
  repairs,
  advances,
  bills,
  disputes,
  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentLandlordId: (id) => set({ currentLandlordId: id }),
  addExpense: async (expense) => {
    const newExpense = await api.addExpense(expense) as Expense;
    set((state) => ({
      expenses: [...state.expenses, newExpense],
    }));
  },
  addRepair: async (repair) => {
    const newRepair = await api.addRepair(repair) as Repair;
    set((state) => ({
      repairs: [...state.repairs, newRepair],
    }));
  },
  addAdvance: async (advance) => {
    const newAdvance = await api.addAdvance(advance) as Advance;
    set((state) => ({
      advances: [...state.advances, newAdvance],
    }));
  },
  addBill: async (propertyId, year, month) => {
    const newBill = await api.generateBill(propertyId, year, month) as Bill;
    set((state) => {
      const exists = state.bills.some((b) => b.id === newBill.id);
      if (exists) {
        return {
          bills: state.bills.map((b) => (b.id === newBill.id ? newBill : b)),
        };
      }
      return {
        bills: [...state.bills, newBill],
      };
    });
  },
  addDispute: async (dispute) => {
    const newDispute = await api.addDispute(dispute) as Dispute;
    set((state) => ({
      disputes: [...state.disputes, newDispute],
      bills: state.bills.map((b) =>
        b.id === dispute.billId ? { ...b, status: 'disputed' as Bill['status'] } : b
      ),
    }));
  },
  addDisputeMessage: async (disputeId, sender, content) => {
    const updatedDispute = await api.addDisputeMessage(disputeId, sender, content) as Dispute;
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId ? updatedDispute : d
      ),
    }));
  },
  resolveDispute: async (id, status, resolution) => {
    const updatedDispute = await api.resolveDispute(id, status, resolution) as Dispute;
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === id ? updatedDispute : d
      ),
      bills: status === 'resolved'
        ? state.bills.map((b) =>
            b.id === updatedDispute.billId ? { ...b, status: 'confirmed' as Bill['status'] } : b
          )
        : state.bills,
    }));
  },
  updateBillStatus: async (id, status) => {
    await api.updateBillStatus(id, status);
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  },
}));
