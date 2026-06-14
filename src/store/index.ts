import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Costume,
  CostumeStatus,
  AppFilters,
  Operator,
  StudentSize,
  SizeChangeLog,
  TimelineEntry,
  UserRole,
} from "@/types";
import { STATUS_META, USERS, STUCK_PRESET_FILTERS } from "@/constants";
import { genId, nowISO, getDaysInCurrentNode, isNodeStuck } from "@/utils";
import { seedCostumes } from "./seedData";

interface SizeFieldUpdate {
  field: keyof Pick<StudentSize, "height" | "weight" | "chest" | "waist" | "hips" | "size" | "remark">;
  value: string | number | undefined;
}

interface AppState {
  costumes: Costume[];
  recentOpenedIds: string[];
  currentUser: Operator;
  filters: AppFilters;
  sizeHistoryStudentId: string | null;

  setCurrentUser: (user: Operator) => void;
  setFilters: (filters: Partial<AppFilters>) => void;
  resetFilters: () => void;

  addRecentOpened: (costumeId: string) => void;
  openSizeHistory: (studentId: string | null) => void;

  getCostumeById: (id: string) => Costume | undefined;
  getFilteredCostumes: () => Costume[];
  getRecentCostumes: () => Costume[];
  getStuckCostumes: () => Costume[];

  createCostume: (data: Partial<Costume>) => Costume;
  advanceStatus: (costumeId: string, remark: string) => void;
  assignCurrentUser: (role?: UserRole) => void;

  updateStudentSize: (
    costumeId: string,
    studentId: string,
    updates: SizeFieldUpdate[],
    remark?: string
  ) => void;
  setStudentConfirmStatus: (
    costumeId: string,
    studentId: string,
    status: StudentSize["confirmStatus"],
    remark: string
  ) => void;
  bulkConfirmAllSizes: (costumeId: string, remark: string) => void;
  addStudent: (costumeId: string, studentName: string) => void;
  removeStudent: (costumeId: string, studentId: string) => void;
}

const STORAGE_KEY = "dance-costume-app-state";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      costumes: seedCostumes,
      recentOpenedIds: [],
      currentUser: USERS.admin[0],
      filters: {},
      sizeHistoryStudentId: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      resetFilters: () => set({ filters: {} }),

      addRecentOpened: (costumeId) =>
        set((state) => {
          const rest = state.recentOpenedIds.filter((id) => id !== costumeId);
          return { recentOpenedIds: [costumeId, ...rest].slice(0, 5) };
        }),

      openSizeHistory: (studentId) => set({ sizeHistoryStudentId: studentId }),

      getCostumeById: (id) => get().costumes.find((c) => c.id === id),

      getFilteredCostumes: () => {
        const { costumes, filters } = get();
        return costumes.filter((c) => {
          if (filters.status && c.status !== filters.status) return false;
          if (filters.assigneeRole && c.currentAssigneeRole !== filters.assigneeRole) return false;
          if (filters.keyword) {
            const kw = filters.keyword.toLowerCase();
            if (
              !c.name.toLowerCase().includes(kw) &&
              !c.classes.toLowerCase().includes(kw) &&
              !c.currentAssignee.toLowerCase().includes(kw)
            )
              return false;
          }
          if (filters.stuckPreset) {
            const preset = STUCK_PRESET_FILTERS.find((p) => p.key === filters.stuckPreset);
            if (preset) {
              if (preset.key === "stuck_any") {
                if (!isNodeStuck(c)) return false;
              } else {
                const days = getDaysInCurrentNode(c);
                if (!preset.matchStatus?.includes(c.status)) return false;
                if (days < preset.minDays) return false;
              }
            }
          }
          if (filters.sizeConfirmStatus) {
            const hasStatus = c.studentSizes.some((s) => s.confirmStatus === filters.sizeConfirmStatus);
            if (!hasStatus) return false;
          }
          return true;
        });
      },

      getRecentCostumes: () => {
        const { costumes, recentOpenedIds } = get();
        return recentOpenedIds.map((id) => costumes.find((c) => c.id === id)).filter(Boolean) as Costume[];
      },

      getStuckCostumes: () => {
        return get().costumes.filter((c) => isNodeStuck(c));
      },

      createCostume: (data) => {
        const { currentUser } = get();
        const now = nowISO();
        const id = genId("cs_");
        const status: CostumeStatus = "created";
        const assigneeRole = STATUS_META[status].assigneeRole;
        const assignee = USERS[assigneeRole][0];
        const timelineEntry: TimelineEntry = {
          id: genId("tl_"),
          costumeId: id,
          status,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          timestamp: now,
          remark: data.remark || "新建演出服装任务",
        };
        const costume: Costume = {
          id,
          name: data.name || "新演出服装任务",
          performanceDate: data.performanceDate || "",
          totalSets: data.totalSets || 0,
          budget: data.budget || 0,
          classes: data.classes || "",
          status,
          currentAssignee: assignee.name,
          currentAssigneeRole: assigneeRole,
          remark: data.remark || "",
          createdAt: now,
          updatedAt: now,
          timeline: [timelineEntry],
          studentSizes: [],
        };
        set((state) => ({ costumes: [costume, ...state.costumes] }));
        return costume;
      },

      advanceStatus: (costumeId, remark) =>
        set((state) => {
          const { currentUser } = get();
          return {
            costumes: state.costumes.map((c) => {
              if (c.id !== costumeId) return c;
              const currentIdx = Object.keys(STATUS_META).indexOf(c.status);
              const nextStatus = Object.keys(STATUS_META)[currentIdx + 1] as CostumeStatus | undefined;
              if (!nextStatus) return c;
              const nextMeta = STATUS_META[nextStatus];
              const nextAssignee = USERS[nextMeta.assigneeRole][0];
              const timelineEntry: TimelineEntry = {
                id: genId("tl_"),
                costumeId,
                status: nextStatus,
                operatorName: currentUser.name,
                operatorRole: currentUser.role,
                timestamp: nowISO(),
                remark,
              };
              return {
                ...c,
                status: nextStatus,
                currentAssignee: nextAssignee.name,
                currentAssigneeRole: nextMeta.assigneeRole,
                updatedAt: nowISO(),
                timeline: [...c.timeline, timelineEntry],
              };
            }),
          };
        }),

      assignCurrentUser: (role = "admin") => {
        const user = USERS[role][0];
        set({ currentUser: user });
      },

      updateStudentSize: (costumeId, studentId, updates, remark = "") =>
        set((state) => {
          const { currentUser } = get();
          return {
            costumes: state.costumes.map((c) => {
              if (c.id !== costumeId) return c;
              return {
                ...c,
                updatedAt: nowISO(),
                studentSizes: c.studentSizes.map((s) => {
                  if (s.id !== studentId) return s;
                  const newLogs: SizeChangeLog[] = updates
                    .filter((u) => String(s[u.field] ?? "") !== String(u.value ?? ""))
                    .map((u) => ({
                      id: genId("log_"),
                      studentSizeId: studentId,
                      fieldName: u.field,
                      oldValue: String(s[u.field] ?? ""),
                      newValue: String(u.value ?? ""),
                      operatorName: currentUser.name,
                      operatorRole: currentUser.role,
                      timestamp: nowISO(),
                      remark,
                    }));
                  const patch = updates.reduce<Partial<StudentSize>>((acc, u) => {
                    (acc as Record<string, unknown>)[u.field] = u.value;
                    return acc;
                  }, {});
                  return {
                    ...s,
                    ...patch,
                    updatedAt: nowISO(),
                    changeLogs: [...s.changeLogs, ...newLogs],
                  };
                }),
              };
            }),
          };
        }),

      setStudentConfirmStatus: (costumeId, studentId, status, remark) =>
        set((state) => {
          const { currentUser } = get();
          return {
            costumes: state.costumes.map((c) => {
              if (c.id !== costumeId) return c;
              return {
                ...c,
                updatedAt: nowISO(),
                studentSizes: c.studentSizes.map((s) => {
                  if (s.id !== studentId) return s;
                  const log: SizeChangeLog = {
                    id: genId("log_"),
                    studentSizeId: studentId,
                    fieldName: "confirmStatus",
                    oldValue: s.confirmStatus,
                    newValue: status,
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    timestamp: nowISO(),
                    remark,
                  };
                  return {
                    ...s,
                    confirmStatus: status,
                    remark,
                    updatedAt: nowISO(),
                    changeLogs: [...s.changeLogs, log],
                  };
                }),
              };
            }),
          };
        }),

      bulkConfirmAllSizes: (costumeId, remark) =>
        set((state) => {
          const { currentUser } = get();
          return {
            costumes: state.costumes.map((c) => {
              if (c.id !== costumeId) return c;
              return {
                ...c,
                updatedAt: nowISO(),
                studentSizes: c.studentSizes.map((s) => {
                  if (s.confirmStatus === "exception") return s;
                  if (s.confirmStatus === "confirmed") return s;
                  const log: SizeChangeLog = {
                    id: genId("log_"),
                    studentSizeId: s.id,
                    fieldName: "confirmStatus",
                    oldValue: s.confirmStatus,
                    newValue: "confirmed",
                    operatorName: currentUser.name,
                    operatorRole: currentUser.role,
                    timestamp: nowISO(),
                    remark,
                  };
                  return {
                    ...s,
                    confirmStatus: "confirmed",
                    updatedAt: nowISO(),
                    changeLogs: [...s.changeLogs, log],
                  };
                }),
              };
            }),
          };
        }),

      addStudent: (costumeId, studentName) =>
        set((state) => ({
          costumes: state.costumes.map((c) => {
            if (c.id !== costumeId) return c;
            const student: StudentSize = {
              id: genId("ss_"),
              costumeId,
              studentName,
              confirmStatus: "pending",
              remark: "",
              createdAt: nowISO(),
              updatedAt: nowISO(),
              changeLogs: [],
            };
            return {
              ...c,
              updatedAt: nowISO(),
              totalSets: c.totalSets + 1,
              studentSizes: [...c.studentSizes, student],
            };
          }),
        })),

      removeStudent: (costumeId, studentId) =>
        set((state) => ({
          costumes: state.costumes.map((c) => {
            if (c.id !== costumeId) return c;
            return {
              ...c,
              updatedAt: nowISO(),
              totalSets: Math.max(0, c.totalSets - 1),
              studentSizes: c.studentSizes.filter((s) => s.id !== studentId),
            };
          }),
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        costumes: state.costumes,
        recentOpenedIds: state.recentOpenedIds,
        currentUser: state.currentUser,
        filters: state.filters,
      }),
    }
  )
);
