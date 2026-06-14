import { create } from 'zustand';
import { Technician, TechnicianStatus } from '../types';
import { mockTechnicians } from '../data/mockData';

interface TechnicianStore {
  technicians: Technician[];
  selectedTechnicianId: string | null;
  loadTechnicians: () => void;
  selectTechnician: (id: string | null) => void;
  updateTechnician: (id: string, updates: Partial<Technician>) => void;
  getTechnicianById: (id: string) => Technician | undefined;
  getAvailableTechnicians: () => Technician[];
  getTechniciansByStatus: (status: TechnicianStatus) => Technician[];
}

export const useTechnicianStore = create<TechnicianStore>((set, get) => ({
  technicians: [],
  selectedTechnicianId: null,

  loadTechnicians: () => {
    set({ technicians: mockTechnicians });
  },

  selectTechnician: (id) => {
    set({ selectedTechnicianId: id });
  },

  updateTechnician: (id, updates) => {
    set((state) => ({
      technicians: state.technicians.map((tech) =>
        tech.id === id ? { ...tech, ...updates } : tech
      ),
    }));
  },

  getTechnicianById: (id) => {
    const { technicians } = get();
    return technicians.find((tech) => tech.id === id);
  },

  getAvailableTechnicians: () => {
    const { technicians } = get();
    return technicians.filter((tech) => tech.status === 'available');
  },

  getTechniciansByStatus: (status) => {
    const { technicians } = get();
    return technicians.filter((tech) => tech.status === status);
  },
}));
