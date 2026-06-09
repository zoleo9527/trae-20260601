import { create } from "zustand";
import { api } from "@/api/client";
import type {
  Referral,
  ReferralStatusChange,
  ReferralChangeSnapshot,
  ReferralStatus,
} from "@/types";

interface ReferralState {
  referrals: Referral[];
  total: number;
  current: Referral | null;
  statusChanges: ReferralStatusChange[];
  snapshots: ReferralChangeSnapshot[];
  loading: boolean;
  fetchReferrals: (params?: Record<string, string>) => Promise<void>;
  fetchReferral: (id: number) => Promise<void>;
  createReferral: (
    data: Omit<Referral, "id" | "status" | "createdBy" | "createdAt" | "updatedAt" | "version"> & { notes?: string }
  ) => Promise<Referral>;
  updateReferral: (
    id: number,
    data: Partial<Pick<Referral, "reason" | "targetDept" | "urgency" | "expectedReturnDays">> & {
      changeNote: string;
    }
  ) => Promise<Referral>;
  changeStatus: (id: number, status: ReferralStatus, note?: string) => Promise<void>;
  fetchStatusChanges: (id: number) => Promise<void>;
  fetchSnapshots: (id: number) => Promise<void>;
}

export const useReferralStore = create<ReferralState>((set) => ({
  referrals: [],
  total: 0,
  current: null,
  statusChanges: [],
  snapshots: [],
  loading: false,

  fetchReferrals: async (params) => {
    set({ loading: true });
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      const res = await api.get<{ data: Referral[]; total: number }>(
        `/referrals${query}`
      );
      set({ referrals: res.data, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchReferral: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get<Referral>(`/referrals/${id}`);
      set({ current: res, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createReferral: async (data) => {
    const res = await api.post<Referral>("/referrals", data);
    return res;
  },

  updateReferral: async (id, data) => {
    const res = await api.put<Referral>(`/referrals/${id}`, data);
    set({ current: res });
    return res;
  },

  changeStatus: async (id, status, note) => {
    const res = await api.patch<Referral>(`/referrals/${id}/status`, {
      status,
      note,
    });
    set({ current: res });
  },

  fetchStatusChanges: async (id) => {
    try {
      const res = await api.get<ReferralStatusChange[]>(
        `/referrals/${id}/changes`
      );
      set({ statusChanges: res });
    } catch {
      set({ statusChanges: [] });
    }
  },

  fetchSnapshots: async (id) => {
    try {
      const res = await api.get<ReferralChangeSnapshot[]>(
        `/referrals/${id}/snapshots`
      );
      set({ snapshots: res });
    } catch {
      set({ snapshots: [] });
    }
  },
}));
