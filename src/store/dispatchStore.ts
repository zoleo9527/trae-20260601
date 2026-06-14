import { create } from 'zustand';
import { Dispatch, DispatchStatus, DispatchResult } from '../types';
import { mockDispatches } from '../data/mockData';

interface DispatchStore {
  dispatches: Dispatch[];
  selectedDispatchId: string | null;
  loadDispatches: () => void;
  selectDispatch: (id: string | null) => void;
  createDispatch: (dispatch: Omit<Dispatch, 'id'>) => Dispatch;
  addDispatch: (dispatch: Omit<Dispatch, 'id'>) => Dispatch;
  confirmDispatch: (id: string) => void;
  completeDispatch: (id: string, result: DispatchResult) => void;
  updateDispatchStatus: (id: string, status: DispatchStatus) => void;
  getDispatchByOrderId: (orderId: string) => Dispatch | undefined;
  getDispatchesByTechnicianId: (technicianId: string) => Dispatch[];
}

export const useDispatchStore = create<DispatchStore>((set, get) => ({
  dispatches: [],
  selectedDispatchId: null,

  loadDispatches: () => {
    set({ dispatches: mockDispatches });
  },

  selectDispatch: (id) => {
    set({ selectedDispatchId: id });
  },

  createDispatch: (dispatchData) => {
    const newDispatch: Dispatch = {
      ...dispatchData,
      id: `D${Date.now()}`,
    };
    set((state) => ({
      dispatches: [...state.dispatches, newDispatch],
    }));
    return newDispatch;
  },

  addDispatch: (dispatchData) => {
    const newDispatch: Dispatch = {
      ...dispatchData,
      id: `D${Date.now()}`,
    };
    set((state) => ({
      dispatches: [...state.dispatches, newDispatch],
    }));
    return newDispatch;
  },

  confirmDispatch: (id) => {
    set((state) => ({
      dispatches: state.dispatches.map((dispatch) =>
        dispatch.id === id
          ? { ...dispatch, confirmedAt: new Date(), status: 'confirmed' }
          : dispatch
      ),
    }));
  },

  completeDispatch: (id, result) => {
    set((state) => ({
      dispatches: state.dispatches.map((dispatch) =>
        dispatch.id === id
          ? { ...dispatch, completedAt: new Date(), status: 'completed', result }
          : dispatch
      ),
    }));
  },

  updateDispatchStatus: (id, status) => {
    set((state) => ({
      dispatches: state.dispatches.map((dispatch) =>
        dispatch.id === id ? { ...dispatch, status } : dispatch
      ),
    }));
  },

  getDispatchByOrderId: (orderId) => {
    const { dispatches } = get();
    return dispatches.find((dispatch) => dispatch.workOrderId === orderId);
  },

  getDispatchesByTechnicianId: (technicianId) => {
    const { dispatches } = get();
    return dispatches.filter((dispatch) => dispatch.technicianId === technicianId);
  },
}));
