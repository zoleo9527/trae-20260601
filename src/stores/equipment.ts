import { create } from 'zustand';
import type { Equipment } from '@/types';
import { mockEquipment } from '@/data/mockData';

interface EquipmentStore {
  equipment: Equipment[];
  searchQuery: string;
  
  fetchEquipment: () => void;
  setSearchQuery: (query: string) => void;
}

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  equipment: [],
  searchQuery: '',

  fetchEquipment: () => {
    set({ equipment: [...mockEquipment] });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
}));
