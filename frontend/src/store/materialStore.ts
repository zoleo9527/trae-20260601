import { create } from 'zustand';
import { MaterialList } from '@/types';
import { mockMaterials } from '@/data/mockMaterials';
import { materialApi } from '@/api/material';

interface MaterialState {
  materials: MaterialList[];
  currentMaterial: MaterialList | null;
  isLoading: boolean;
  error: string | null;

  fetchMaterials: (params?: any) => Promise<void>;
  fetchMaterialById: (id: string) => Promise<void>;
  fetchMaterialByScheduleId: (scheduleId: string) => Promise<void>;
  claimMaterial: (id: string, preparedBy: string) => Promise<void>;
  transitionMaterial: (id: string, data: any) => Promise<void>;
  acknowledgeMaterial: (id: string, acknowledged: boolean, remarks?: string) => Promise<void>;
  clearCurrentMaterial: () => void;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
  materials: [],
  currentMaterial: null,
  isLoading: false,
  error: null,

  fetchMaterials: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.getList(params);
      set({ materials: response.data?.items || mockMaterials, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      set({ materials: mockMaterials, isLoading: false });
    }
  },

  fetchMaterialById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.getById(id);
      set({ currentMaterial: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch material:', error);
      const material = mockMaterials.find(m => m.id === id);
      set({ currentMaterial: material || null, isLoading: false });
    }
  },

  fetchMaterialByScheduleId: async (scheduleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.getByScheduleId(scheduleId);
      set({ currentMaterial: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch material by schedule:', error);
      const material = mockMaterials.find(m => m.scheduleId === scheduleId);
      set({ currentMaterial: material || null, isLoading: false });
    }
  },

  claimMaterial: async (id: string, preparedBy: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.claim(id, preparedBy);
      const updatedMaterial = response.data;
      set(state => ({
        materials: state.materials.map(m => m.id === id ? updatedMaterial : m),
        currentMaterial: state.currentMaterial?.id === id ? updatedMaterial : state.currentMaterial,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to claim material:', error);
      set({ isLoading: false });
    }
  },

  transitionMaterial: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.transition(id, data);
      const updatedMaterial = response.data;
      set(state => ({
        materials: state.materials.map(m => m.id === id ? updatedMaterial : m),
        currentMaterial: state.currentMaterial?.id === id ? updatedMaterial : state.currentMaterial,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to transition material:', error);
      set({ isLoading: false });
    }
  },

  acknowledgeMaterial: async (id: string, acknowledged: boolean, remarks?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await materialApi.acknowledge(id, acknowledged, remarks);
      const updatedMaterial = response.data;
      set(state => ({
        materials: state.materials.map(m => m.id === id ? updatedMaterial : m),
        currentMaterial: state.currentMaterial?.id === id ? updatedMaterial : state.currentMaterial,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to acknowledge material:', error);
      set({ isLoading: false });
    }
  },

  clearCurrentMaterial: () => {
    set({ currentMaterial: null });
  },
}));
