import { create } from 'zustand';
import type { Part } from '@/types';
import { mockParts } from '@/data/mockData';

interface PartsStore {
  parts: Part[];
  searchQuery: string;
  
  fetchParts: () => void;
  setSearchQuery: (query: string) => void;
  outboundParts: (partId: string, quantity: number) => void;
}

export const usePartsStore = create<PartsStore>((set, get) => ({
  parts: [],
  searchQuery: '',

  fetchParts: () => {
    set({ parts: [...mockParts] });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  outboundParts: (partId, quantity) => {
    set(state => ({
      parts: state.parts.map(p => 
        p.id === partId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      ),
    }));
  },
}));
