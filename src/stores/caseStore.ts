import { create } from 'zustand';
import type { Case, CaseStage, UserRole, TaskStatus, SceneType, ExceptionType } from '@/types';
import { SCENE_DATASETS } from '@/data/mockCases';

interface FilterState {
  role: 'all' | UserRole;
  stage: 'all' | CaseStage;
  status: 'all' | TaskStatus;
  keyword: string;
  onlyException: boolean;
}

interface CaseStore {
  cases: Case[];
  activeCaseId: string | null;
  currentScene: SceneType;
  filter: FilterState;
  setScene: (scene: SceneType) => void;
  selectCase: (id: string | null) => void;
  setFilter: (patch: Partial<FilterState>) => void;
  updateCaseStage: (caseId: string, stage: CaseStage, handler: string, handlerRole: UserRole, logNote: string) => void;
  markException: (caseId: string, type: ExceptionType) => void;
  clearException: (caseId: string, type: ExceptionType) => void;
  getActiveCase: () => Case | undefined;
  getFilteredCases: () => Case[];
  appendFlowLog: (
    caseId: string,
    stage: CaseStage,
    action: string,
    operator: string,
    operatorRole: UserRole,
    detail: string,
  ) => void;
  pushCorrection: (caseId: string, correction: Case['corrections'][number]) => void;
  updateCorrection: (correctionId: string, patch: Partial<Case['corrections'][number]>) => void;
  pushOpinion: (caseId: string, opinion: Case['opinions'][number]) => void;
  pushReview: (caseId: string, review: Case['reviews'][number]) => void;
  updateReview: (reviewId: string, patch: Partial<Case['reviews'][number]>) => void;
  setDispatch: (caseId: string, patch: Partial<NonNullable<Case['dispatch']>>) => void;
  updateCase: (caseId: string, patch: Partial<Case>) => void;
  updateSample: (caseId: string, sampleId: string, patch: Partial<Case['samples'][number]>) => void;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  cases: SCENE_DATASETS.normal,
  activeCaseId: null,
  currentScene: 'normal',
  filter: {
    role: 'all',
    stage: 'all',
    status: 'all',
    keyword: '',
    onlyException: false,
  },

  setScene: (scene) => {
    set({
      currentScene: scene,
      cases: JSON.parse(JSON.stringify(SCENE_DATASETS[scene])),
      activeCaseId: null,
    });
  },

  selectCase: (id) => set({ activeCaseId: id }),

  setFilter: (patch) =>
    set((s) => ({
      filter: { ...s.filter, ...patch },
    })),

  updateCaseStage: (caseId, stage, handler, handlerRole, logNote) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              currentStage: stage,
              currentHandler: handler,
              currentHandlerRole: handlerRole,
              stuckHours: 0.1,
              flowLogs: [
                ...c.flowLogs,
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  caseId,
                  stage,
                  action: logNote,
                  operator: handler,
                  operatorRole: handlerRole,
                  timestamp: new Date().toISOString(),
                  detail: logNote,
                },
              ],
            }
          : c,
      ),
    })),

  markException: (caseId, type) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              hasException: true,
              exceptionTypes: c.exceptionTypes.includes(type) ? c.exceptionTypes : [...c.exceptionTypes, type],
            }
          : c,
      ),
    })),

  clearException: (caseId, type) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              exceptionTypes: c.exceptionTypes.filter((t) => t !== type),
              hasException: c.exceptionTypes.filter((t) => t !== type).length > 0,
            }
          : c,
      ),
    })),

  getActiveCase: () => {
    const { cases, activeCaseId } = get();
    return cases.find((c) => c.id === activeCaseId);
  },

  getFilteredCases: () => {
    const { cases, filter } = get();
    return cases.filter((c) => {
      if (filter.role !== 'all' && c.currentHandlerRole !== filter.role) return false;
      if (filter.stage !== 'all' && c.currentStage !== filter.stage) return false;
      if (filter.status !== 'all' && c.status !== filter.status) return false;
      if (filter.onlyException && !c.hasException) return false;
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        if (
          !c.caseNo.toLowerCase().includes(kw) &&
          !c.title.toLowerCase().includes(kw) &&
          !c.entrustParty.toLowerCase().includes(kw) &&
          !c.currentHandler.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  },

  appendFlowLog: (caseId, stage, action, operator, operatorRole, detail) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              flowLogs: [
                ...c.flowLogs,
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  caseId,
                  stage,
                  action,
                  operator,
                  operatorRole,
                  timestamp: new Date().toISOString(),
                  detail,
                },
              ],
            }
          : c,
      ),
    })),

  pushCorrection: (caseId, correction) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId ? { ...c, corrections: [...c.corrections, correction] } : c,
      ),
    })),

  updateCorrection: (correctionId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => ({
        ...c,
        corrections: c.corrections.map((co) => (co.id === correctionId ? { ...co, ...patch } : co)),
      })),
    })),

  pushOpinion: (caseId, opinion) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId ? { ...c, opinions: [...c.opinions, opinion] } : c,
      ),
    })),

  pushReview: (caseId, review) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId ? { ...c, reviews: [...c.reviews, review] } : c,
      ),
    })),

  updateReview: (reviewId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => ({
        ...c,
        reviews: c.reviews.map((r) => (r.id === reviewId ? { ...r, ...patch } : r)),
      })),
    })),

  setDispatch: (caseId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              dispatch: c.dispatch ? { ...c.dispatch, ...patch } : ({ id: `d-${caseId}`, caseId, status: 'in_progress', blockReasons: [], ...patch } as NonNullable<Case['dispatch']>),
            }
          : c,
      ),
    })),

  updateCase: (caseId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.id === caseId ? { ...c, ...patch } : c)),
    })),

  updateSample: (caseId, sampleId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              samples: c.samples.map((sa) => (sa.id === sampleId ? { ...sa, ...patch } : sa)),
            }
          : c,
      ),
    })),
}));
