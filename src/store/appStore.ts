import { create } from 'zustand';
import type {
  SurrenderApplication,
  ApplicationStatus,
  UserRole,
  Inspection,
  CostBreakdown,
  Confirmation,
  Dispute,
  DisputeResponse,
} from '@/types';
import { mockApplications } from '@/data/mockData';
import { generateId } from '@/utils/formatters';

interface AppState {
  applications: SurrenderApplication[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  getApplicationById: (id: string) => SurrenderApplication | undefined;
  addApplication: (app: Omit<SurrenderApplication, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'confirmation'>) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateInspection: (id: string, inspection: Inspection) => void;
  updateCostBreakdown: (id: string, cost: CostBreakdown) => void;
  updateConfirmation: (id: string, confirmation: Confirmation) => void;
  addDispute: (appId: string, dispute: Omit<Dispute, 'id' | 'createdAt'>) => void;
  respondDispute: (appId: string, disputeId: string, response: DisputeResponse) => void;
  finalConfirm: (appId: string, confirmerName: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  applications: mockApplications,
  currentRole: 'consultant',

  setCurrentRole: (role) => set({ currentRole: role }),

  getApplicationById: (id) => get().applications.find((a) => a.id === id),

  addApplication: (app) =>
    set((state) => ({
      applications: [
        {
          ...app,
          id: generateId('app'),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          confirmation: { id: generateId('conf'), disputes: [] },
        },
        ...state.applications,
      ],
    })),

  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      ),
    })),

  updateInspection: (id, inspection) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id
          ? { ...a, inspection, status: 'inspecting', updatedAt: new Date().toISOString() }
          : a
      ),
    })),

  updateCostBreakdown: (id, cost) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id
          ? { ...a, costBreakdown: cost, status: 'confirming', updatedAt: new Date().toISOString() }
          : a
      ),
    })),

  updateConfirmation: (id, confirmation) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, confirmation, updatedAt: new Date().toISOString() } : a
      ),
    })),

  addDispute: (appId, dispute) =>
    set((state) => ({
      applications: state.applications.map((a) => {
        if (a.id !== appId) return a;
        const newDispute: Dispute = {
          ...dispute,
          id: generateId('disp'),
          createdAt: new Date().toISOString(),
        };
        return {
          ...a,
          status: 'disputing',
          confirmation: a.confirmation
            ? { ...a.confirmation, disputes: [...a.confirmation.disputes, newDispute] }
            : { id: generateId('conf'), disputes: [newDispute] },
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  respondDispute: (appId, disputeId, response) =>
    set((state) => ({
      applications: state.applications.map((a) => {
        if (a.id !== appId || !a.confirmation) return a;
        return {
          ...a,
          confirmation: {
            ...a.confirmation,
            disputes: a.confirmation.disputes.map((d) =>
              d.id === disputeId ? { ...d, response } : d
            ),
          },
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  finalConfirm: (appId, confirmerName) =>
    set((state) => ({
      applications: state.applications.map((a) => {
        if (a.id !== appId) return a;
        return {
          ...a,
          status: 'completed',
          confirmation: a.confirmation
            ? {
                ...a.confirmation,
                finalConfirmed: true,
                confirmedAt: new Date().toISOString(),
                confirmerName,
              }
            : {
                id: generateId('conf'),
                disputes: [],
                finalConfirmed: true,
                confirmedAt: new Date().toISOString(),
                confirmerName,
              },
          updatedAt: new Date().toISOString(),
        };
      }),
    })),
}));
