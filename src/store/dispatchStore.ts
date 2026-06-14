import { create } from 'zustand';
import { Dispatch, DispatchStatus, DispatchResult } from '../types';
import { mockDispatches } from '../data/mockData';

interface DispatchStore {
  dispatches: Dispatch[];
  selectedDispatchId: string | null;
  loadDispatches: () => void;
  selectDispatch: (id: string | null) => void;
  createDispatch: (dispatch: Omit<Dispatch, 'id'>) => void;
  confirmDispatch: (id: string) => void;
  completeDispatch: (id: string, result: DispatchResult) => void;
  updateDispatchStatus: (id: string, status: DispatchStatus) => void;
  getDispatchByOrderId: (orderId: string) => Dispatch | undefined;
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
          ? { ...dispatch, status: 'completed', result }
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
}));
