import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff, ResponsibleRole } from '../types';
import { genId } from '../utils/id';

interface StaffState {
  staff: Staff[];
  addStaff: (s: Omit<Staff, 'id'>) => Staff;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  removeStaff: (id: string) => void;
  getByRole: (role: ResponsibleRole) => Staff[];
  getById: (id: string) => Staff | undefined;
}

const SEED_STAFF: Staff[] = [
  { id: 's1', name: '张伟', role: 'consultant', department: '税务一部', phone: '13800001001' },
  { id: 's2', name: '李娜', role: 'consultant', department: '税务二部', phone: '13800001002' },
  { id: 's3', name: '王强', role: 'project_manager', department: '项目部', phone: '13800002001' },
  { id: 's4', name: '赵敏', role: 'project_manager', department: '项目部', phone: '13800002002' },
  { id: 's5', name: '刘洋', role: 'client_finance', department: '客户方', phone: '13800003001' },
  { id: 's6', name: '陈静', role: 'client_finance', department: '客户方', phone: '13800003002' },
];

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: SEED_STAFF,
      addStaff: (data) => {
        const s: Staff = { ...data, id: genId('s') };
        set((st) => ({ staff: [...st.staff, s] }));
        return s;
      },
      updateStaff: (id, patch) => {
        set((st) => ({
          staff: st.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
      },
      removeStaff: (id) => {
        set((st) => ({ staff: st.staff.filter((s) => s.id !== id) }));
      },
      getByRole: (role) => get().staff.filter((s) => s.role === role),
      getById: (id) => get().staff.find((s) => s.id === id),
    }),
    { name: 'tax-staff' }
  )
);
