import { create } from 'zustand';
import type { Claim, Order, Vehicle, Payment, Remark } from '../types';
import { mockClaims, mockOrders, mockVehicles, mockPayments } from '../data/mockData';

interface ClaimStore {
  claims: Claim[];
  orders: Order[];
  vehicles: Vehicle[];
  payments: Payment[];
  selectedClaimId: string | null;
  sidebarOpen: boolean;

  selectClaim: (id: string | null) => void;
  toggleSidebar: () => void;
  addRemark: (claimId: string, remark: Omit<Remark, 'id' | 'claimId' | 'createdAt'>) => void;
  updateClaimStatus: (claimId: string, status: Claim['status']) => void;
  updateResponsibility: (claimId: string, responsibility: Claim['responsibility']) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => void;
  getClaimById: (id: string) => Claim | undefined;
  getOrderById: (id: string) => Order | undefined;
  getVehicleById: (id: string) => Vehicle | undefined;
  getPaymentByClaimId: (claimId: string) => Payment | undefined;
  getClaimsByStatus: (status: Claim['status']) => Claim[];
}

export const useClaimStore = create<ClaimStore>((set, get) => ({
  claims: mockClaims,
  orders: mockOrders,
  vehicles: mockVehicles,
  payments: mockPayments,
  selectedClaimId: null,
  sidebarOpen: false,

  selectClaim: (id) => {
    set({ selectedClaimId: id, sidebarOpen: id !== null });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  addRemark: (claimId, remark) => {
    const newRemark: Remark = {
      ...remark,
      id: `r${Date.now()}`,
      claimId,
      createdAt: new Date(),
    };
    set((state) => ({
      claims: state.claims.map((claim) =>
        claim.id === claimId
          ? { ...claim, remarks: [...claim.remarks, newRemark], updatedAt: new Date() }
          : claim
      ),
    }));
  },

  updateClaimStatus: (claimId, status) => {
    set((state) => ({
      claims: state.claims.map((claim) =>
        claim.id === claimId ? { ...claim, status, updatedAt: new Date() } : claim
      ),
    }));
  },

  updateResponsibility: (claimId, responsibility) => {
    set((state) => ({
      claims: state.claims.map((claim) =>
        claim.id === claimId ? { ...claim, responsibility, updatedAt: new Date() } : claim
      ),
    }));
  },

  addPayment: (payment) => {
    const newPayment: Payment = {
      ...payment,
      id: `p${Date.now()}`,
    };
    set((state) => ({ payments: [...state.payments, newPayment] }));
  },

  updatePaymentStatus: (paymentId, status) => {
    const now = new Date();
    set((state) => ({
      payments: state.payments.map((payment) => {
        if (payment.id === paymentId) {
          const updated = { ...payment, status };
          if (status === 'approved') updated.approvedAt = now;
          if (status === 'paid') updated.paidAt = now;
          return updated;
        }
        return payment;
      }),
    }));
  },

  getClaimById: (id) => {
    return get().claims.find((claim) => claim.id === id);
  },

  getOrderById: (id) => {
    return get().orders.find((order) => order.id === id);
  },

  getVehicleById: (id) => {
    return get().vehicles.find((vehicle) => vehicle.id === id);
  },

  getPaymentByClaimId: (claimId) => {
    return get().payments.find((payment) => payment.claimId === claimId);
  },

  getClaimsByStatus: (status) => {
    return get().claims.filter((claim) => claim.status === status);
  },
}));
