import { create } from 'zustand';
import type { Role, TourGroupStatus, TourGroup, Dispatch, CheckIn, FleetAssignment, Guide } from '../types';
import { tourGroups as initialTourGroups, dispatches as initialDispatches, checkIns as initialCheckIns, fleetAssignments as initialFleet, guides as initialGuides } from '../data/mockData';

interface AppState {
  role: Role;
  setRole: (role: Role) => void;

  tourGroups: TourGroup[];
  dispatches: Dispatch[];
  checkIns: CheckIn[];
  fleetAssignments: FleetAssignment[];
  guides: Guide[];

  selectedTourGroupId: string | null;
  setSelectedTourGroupId: (id: string | null) => void;

  filterKeyword: string;
  filterStatus: TourGroupStatus | '';
  filterGuideName: string;
  setFilterKeyword: (v: string) => void;
  setFilterStatus: (v: TourGroupStatus | '') => void;
  setFilterGuideName: (v: string) => void;

  dispatchPanelOpen: boolean;
  setDispatchPanelOpen: (v: boolean) => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (v: boolean) => void;
  timelineModalOpen: boolean;
  setTimelineModalOpen: (v: boolean) => void;

  dispatchGuide: (tourGroupId: string, guideId: string) => void;
  confirmCheckIn: (tourGroupId: string, exception?: string) => void;
  confirmFleet: (tourGroupId: string) => void;

  filteredTourGroups: () => TourGroup[];
}

export const useAppStore = create<AppState>((set, get) => ({
  role: 'dispatcher',
  setRole: (role) => set({ role }),

  tourGroups: initialTourGroups,
  dispatches: initialDispatches,
  checkIns: initialCheckIns,
  fleetAssignments: initialFleet,
  guides: initialGuides,

  selectedTourGroupId: null,
  setSelectedTourGroupId: (id) => set({ selectedTourGroupId: id }),

  filterKeyword: '',
  filterStatus: '',
  filterGuideName: '',
  setFilterKeyword: (v) => set({ filterKeyword: v }),
  setFilterStatus: (v) => set({ filterStatus: v }),
  setFilterGuideName: (v) => set({ filterGuideName: v }),

  dispatchPanelOpen: false,
  setDispatchPanelOpen: (v) => set({ dispatchPanelOpen: v }),
  checkInModalOpen: false,
  setCheckInModalOpen: (v) => set({ checkInModalOpen: v }),
  timelineModalOpen: false,
  setTimelineModalOpen: (v) => set({ timelineModalOpen: v }),

  dispatchGuide: (tourGroupId, guideId) => {
    const newDispatch: Dispatch = {
      id: `d_${Date.now()}`,
      tourGroupId,
      guideId,
      dispatchedAt: new Date().toISOString(),
      dispatchStatus: 'dispatched',
    };
    const newCheckIn: CheckIn = {
      id: `c_${Date.now()}`,
      tourGroupId,
      guideId,
      checkedInAt: null,
      checkInStatus: 'pending',
      exception: null,
    };
    set((state) => ({
      dispatches: [...state.dispatches, newDispatch],
      checkIns: [...state.checkIns, newCheckIn],
      tourGroups: state.tourGroups.map((tg) =>
        tg.id === tourGroupId ? { ...tg, status: 'dispatched' as TourGroupStatus } : tg
      ),
      dispatchPanelOpen: false,
      selectedTourGroupId: null,
    }));
  },

  confirmCheckIn: (tourGroupId, exception) => {
    set((state) => ({
      checkIns: state.checkIns.map((ci) =>
        ci.tourGroupId === tourGroupId
          ? {
              ...ci,
              checkedInAt: new Date().toISOString(),
              checkInStatus: exception ? ('exception' as const) : ('checked_in' as const),
              exception: exception || null,
            }
          : ci
      ),
      tourGroups: state.tourGroups.map((tg) =>
        tg.id === tourGroupId
          ? { ...tg, status: (exception ? 'stuck' : 'checked_in') as TourGroupStatus }
          : tg
      ),
      checkInModalOpen: false,
      selectedTourGroupId: null,
    }));
  },

  confirmFleet: (tourGroupId) => {
    set((state) => {
      const currentGroup = state.tourGroups.find((tg) => tg.id === tourGroupId);
      const currentCheckIn = state.checkIns.find((ci) => ci.tourGroupId === tourGroupId);
      const newStatus: TourGroupStatus =
        currentGroup?.status === 'checked_in' && currentCheckIn?.checkInStatus === 'checked_in'
          ? 'completed'
          : 'fleet_ready';
      return {
        fleetAssignments: state.fleetAssignments.map((fa) =>
          fa.tourGroupId === tourGroupId
            ? { ...fa, fleetStatus: 'ready' as const, confirmedAt: new Date().toISOString() }
            : fa
        ),
        tourGroups: state.tourGroups.map((tg) =>
          tg.id === tourGroupId ? { ...tg, status: newStatus } : tg
        ),
      };
    });
  },

  filteredTourGroups: () => {
    const { tourGroups, dispatches, checkIns, guides, filterKeyword, filterStatus, filterGuideName } = get();
    return tourGroups.filter((tg) => {
      if (filterStatus && tg.status !== filterStatus) return false;
      if (filterKeyword) {
        const kw = filterKeyword.toLowerCase();
        const match =
          tg.groupCode.toLowerCase().includes(kw) ||
          tg.tourName.toLowerCase().includes(kw);
        if (!match) return false;
      }
      if (filterGuideName) {
        const dispatch = dispatches.find((d) => d.tourGroupId === tg.id);
        if (!dispatch) return false;
        const guide = guides.find((g) => g.id === dispatch.guideId);
        if (!guide || !guide.name.includes(filterGuideName)) return false;
      }
      return true;
    });
  },
}));
