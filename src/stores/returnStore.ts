import { create } from "zustand";
import { api } from "@/api/client";
import type { ResultReturn } from "@/types";

interface ReturnState {
  returns: ResultReturn[];
  total: number;
  current: ResultReturn | null;
  loading: boolean;
  fetchReturns: (params?: Record<string, string>) => Promise<void>;
  fetchReturn: (id: number) => Promise<void>;
  confirmReturn: (
    id: number,
    data?: { changeAcknowledged?: boolean; note?: string }
  ) => Promise<void>;
}

export const useReturnStore = create<ReturnState>((set) => ({
  returns: [],
  total: 0,
  current: null,
  loading: false,

  fetchReturns: async (params) => {
    set({ loading: true });
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      const res = await api.get<{ data: ResultReturn[]; total: number }>(
        `/returns${query}`
      );
      set({ returns: res.data, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchReturn: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get<ResultReturn>(`/returns/${id}`);
      set({ current: res, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  confirmReturn: async (id, data) => {
    const res = await api.patch<ResultReturn>(`/returns/${id}/confirm`, data);
    set({ current: res });
  },
}));
