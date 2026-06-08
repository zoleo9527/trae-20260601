import { create } from 'zustand';
import type { Role, TourGroupStatus, StuckDurationThreshold, TourGroup, Dispatch, CheckIn, FleetAssignment, Guide, FollowUpRecord } from '../types';
import { tourGroups as initialTourGroups, dispatches as initialDispatches, checkIns as initialCheckIns, fleetAssignments as initialFleet, guides as initialGuides } from '../data/mockData';

export function calcStuckDuration(stuckAt: string | null): number {
  if (!stuckAt) return 0;
  return Date.now() - new Date(stuckAt).getTime();
}

export function formatStuckDuration(ms: number): string {
  if (ms <= 0) return '0分钟';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

export function isStuckOver24h(stuckAt: string | null): boolean {
  return calcStuckDuration(stuckAt) >= 24 * 60 * 60 * 1000;
}

export function calcPendingFollowUpMs(followUps: FollowUpRecord[]): number {
  const unresolved = followUps.filter((f) => !f.isResolved);
  if (unresolved.length === 0) return followUps.length === 0 ? Infinity : 0;
  const latest = unresolved[unresolved.length - 1];
  return Date.now() - new Date(latest.createdAt).getTime();
}

export function needsFollowUp(followUps: FollowUpRecord[]): boolean {
  if (followUps.length === 0) return true;
  return calcPendingFollowUpMs(followUps) >= 4 * 60 * 60 * 1000;
}

export function isFollowUpDelayed(followUps: FollowUpRecord[]): boolean {
  return calcPendingFollowUpMs(followUps) >= 12 * 60 * 60 * 1000;
}

export function formatFollowUpDuration(ms: number): string {
  if (ms === Infinity) return '未跟进';
  if (ms <= 0) return '刚刚';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}小时${minutes}分钟未跟进`;
  return `${minutes}分钟未跟进`;
}

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
  filterStuckDuration: StuckDurationThreshold;
  filterNeedsFollowUp: boolean;
  setFilterKeyword: (v: string) => void;
  setFilterStatus: (v: TourGroupStatus | '') => void;
  setFilterGuideName: (v: string) => void;
  setFilterStuckDuration: (v: StuckDurationThreshold) => void;
  setFilterNeedsFollowUp: (v: boolean) => void;

  dispatchPanelOpen: boolean;
  setDispatchPanelOpen: (v: boolean) => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (v: boolean) => void;
  timelineModalOpen: boolean;
  setTimelineModalOpen: (v: boolean) => void;
  followUpModalOpen: boolean;
  setFollowUpModalOpen: (v: boolean) => void;

  dispatchGuide: (tourGroupId: string, guideId: string) => void;
  confirmCheckIn: (tourGroupId: string, exception?: string) => void;
  confirmFleet: (tourGroupId: string) => void;
  addFollowUp: (tourGroupId: string, content: string) => void;
  resolveStuck: (tourGroupId: string, resolveNote: string) => void;

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
  filterStuckDuration: '' as StuckDurationThreshold,
  filterNeedsFollowUp: false,
  setFilterKeyword: (v) => set({ filterKeyword: v }),
  setFilterStatus: (v) => set({ filterStatus: v }),
  setFilterGuideName: (v) => set({ filterGuideName: v }),
  setFilterStuckDuration: (v) => set({ filterStuckDuration: v }),
  setFilterNeedsFollowUp: (v) => set({ filterNeedsFollowUp: v }),

  dispatchPanelOpen: false,
  setDispatchPanelOpen: (v) => set({ dispatchPanelOpen: v }),
  checkInModalOpen: false,
  setCheckInModalOpen: (v) => set({ checkInModalOpen: v }),
  timelineModalOpen: false,
  setTimelineModalOpen: (v) => set({ timelineModalOpen: v }),
  followUpModalOpen: false,
  setFollowUpModalOpen: (v) => set({ followUpModalOpen: v }),

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
          ? { ...tg, status: (exception ? 'stuck' : 'checked_in') as TourGroupStatus, stuckAt: exception ? new Date().toISOString() : null }
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

  addFollowUp: (tourGroupId, content) => {
    const newFollowUp: FollowUpRecord = {
      id: `fu_${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      isResolved: false,
    };
    set((state) => ({
      tourGroups: state.tourGroups.map((tg) =>
        tg.id === tourGroupId
          ? { ...tg, followUps: [...tg.followUps, newFollowUp] }
          : tg
      ),
      followUpModalOpen: false,
      selectedTourGroupId: null,
    }));
  },

  resolveStuck: (tourGroupId, resolveNote) => {
    const resolveFollowUp: FollowUpRecord = {
      id: `fu_${Date.now()}`,
      content: `标记已处理：${resolveNote}`,
      createdAt: new Date().toISOString(),
      isResolved: true,
    };
    set((state) => ({
      tourGroups: state.tourGroups.map((tg) =>
        tg.id === tourGroupId
          ? {
              ...tg,
              status: 'checked_in' as TourGroupStatus,
              stuckAt: null,
              followUps: [...tg.followUps, resolveFollowUp],
            }
          : tg
      ),
      checkIns: state.checkIns.map((ci) =>
        ci.tourGroupId === tourGroupId
          ? { ...ci, checkInStatus: 'checked_in' as const, checkedInAt: ci.checkedInAt || new Date().toISOString(), exception: null }
          : ci
      ),
      followUpModalOpen: false,
      selectedTourGroupId: null,
    }));
  },

  filteredTourGroups: () => {
    const { tourGroups, dispatches, checkIns, guides, filterKeyword, filterStatus, filterGuideName, filterStuckDuration, filterNeedsFollowUp } = get();
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
      if (filterStuckDuration && tg.status === 'stuck') {
        const dur = calcStuckDuration(tg.stuckAt);
        if (filterStuckDuration === 'over12h' && dur < 12 * 60 * 60 * 1000) return false;
        if (filterStuckDuration === 'over24h' && dur < 24 * 60 * 60 * 1000) return false;
      }
      if (filterNeedsFollowUp && tg.status === 'stuck') {
        if (!needsFollowUp(tg.followUps)) return false;
      }
      return true;
    });
  },
}));
