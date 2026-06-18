content = '''import { create } from "zustand";
import type { UserRole, Verification, Complaint } from "@/types";
import { mockVerifications, mockComplaints, mockActivities, getRoleTodos, getRoleRisks } from "@/data/mockData";

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  verifications: Verification[];
  complaints: Complaint[];
  activities: typeof mockActivities;
  getTodos: () => ReturnType<typeof getRoleTodos>;
  getRisks: () => ReturnType<typeof getRoleRisks>;
  updateComplaintStatus: (id: string, status: Complaint["status"]) => void;
  addVisitLog: (complaintId: string, log: Omit<Complaint["visitLogs"][number], "id" | "complaintId">) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAll: (ids: string[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: "floor_manager",
  setCurrentRole: (role) => set({ currentRole: role, selectedIds: new Set() }),
  verifications: mockVerifications,
  complaints: mockComplaints,
  activities: mockActivities,
  getTodos: () => getRoleTodos(get().currentRole),
  getRisks: () => getRoleRisks(get().currentRole),
  updateComplaintStatus: (id, status) =>
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)),
    })),
  addVisitLog: (complaintId, log) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              visitLogs: [
                ...c.visitLogs,
                { ...log, id: `HF${Date.now()}`, complaintId },
              ],
            }
          : c
      ),
    })),
  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  clearSelected: () => set({ selectedIds: new Set() }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
}));
'''
with open('/Users/liu/Documents/private/model-test/trae-20260601-4/src/store/useAppStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("OK")
