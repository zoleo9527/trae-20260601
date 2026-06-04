import { create } from 'zustand';
import type { Role, Prescription, PrescriptionDetail, RoleTodoCount } from '../../shared/types';

interface AppState {
  currentRole: Role | null;
  operatorName: string;
  prescriptions: Prescription[];
  currentPrescription: PrescriptionDetail | null;
  todoCount: RoleTodoCount | null;
  loading: boolean;
  setCurrentRole: (role: Role | null) => void;
  setOperatorName: (name: string) => void;
  setPrescriptions: (prescriptions: Prescription[]) => void;
  setCurrentPrescription: (prescription: PrescriptionDetail | null) => void;
  setTodoCount: (count: RoleTodoCount | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: null,
  operatorName: '',
  prescriptions: [],
  currentPrescription: null,
  todoCount: null,
  loading: false,
  setCurrentRole: (role) => set({ currentRole: role }),
  setOperatorName: (name) => set({ operatorName: name }),
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  setCurrentPrescription: (prescription) => set({ currentPrescription: prescription }),
  setTodoCount: (count) => set({ todoCount: count }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({
      currentRole: null,
      operatorName: '',
      prescriptions: [],
      currentPrescription: null,
      todoCount: null,
    }),
}));
