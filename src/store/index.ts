import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Employee, StatusLog, TrainingRecord, DocumentItem, RiskFlag,
  CurrentUser, EmployeeStatus, UserRole, TrainingInput, DocumentType, RiskFlagType, Filters,
} from '@/types';
import { STATUS_OWNER_MAP, VALID_TRANSITIONS, USER_NAMES } from '@/constants';
import { buildInitialData } from '@/data/mockData';

function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function nowISO(): string {
  return new Date().toISOString();
}

interface AppState {
  currentUser: CurrentUser;
  employees: Employee[];
  statusLogs: StatusLog[];
  trainingRecords: TrainingRecord[];
  documents: DocumentItem[];
  riskFlags: RiskFlag[];
  selectedEmployeeIds: string[];
  filters: Filters;

  setCurrentRole: (role: UserRole) => void;
  updateEmployeeStatus: (employeeId: string, newStatus: EmployeeStatus, remark?: string) => void;
  submitTraining: (employeeId: string, training: TrainingInput, remark?: string) => void;
  batchSubmitTraining: (employeeIds: string[], remark?: string) => void;
  updateDocument: (employeeId: string, docType: DocumentType, collected: boolean, remark?: string) => void;
  addRiskFlag: (employeeId: string, flagType: RiskFlagType, description: string) => void;
  resolveRiskFlag: (flagId: string, remark: string) => void;
  toggleEmployeeSelection: (employeeId: string) => void;
  setEmployeeSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setFilters: (newFilters: Partial<Filters>) => void;
  clearFilters: () => void;
  resetAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialData = buildInitialData();

      function _appendStatusLog(
        employeeId: string,
        fromStatus: EmployeeStatus | null,
        toStatus: EmployeeStatus,
        remark?: string,
      ) {
        const user = get().currentUser;
        const log: StatusLog = {
          id: uid('log_'),
          employeeId,
          fromStatus,
          toStatus,
          operator: user.name,
          operatorRole: user.role,
          remark,
          timestamp: nowISO(),
        };
        set((state) => ({ statusLogs: [...state.statusLogs, log] }));
      }

      function _isValidTransition(from: EmployeeStatus, to: EmployeeStatus): boolean {
        return VALID_TRANSITIONS[from]?.includes(to) ?? false;
      }

      return {
        currentUser: {
          role: 'site_supervisor',
          name: USER_NAMES['site_supervisor'],
        },
        employees: initialData.employees,
        statusLogs: initialData.statusLogs,
        trainingRecords: initialData.trainingRecords,
        documents: initialData.documents,
        riskFlags: initialData.riskFlags,
        selectedEmployeeIds: [],
        filters: {},

        setCurrentRole: (role: UserRole) => {
          set({ currentUser: { role, name: USER_NAMES[role] } });
        },

        updateEmployeeStatus: (employeeId: string, newStatus: EmployeeStatus, remark?: string) => {
          const employee = get().employees.find((e) => e.id === employeeId);
          if (!employee) return;
          if (!_isValidTransition(employee.currentStatus, newStatus)) return;

          const owner = STATUS_OWNER_MAP[newStatus];
          _appendStatusLog(employeeId, employee.currentStatus, newStatus, remark);

          set((state) => ({
            employees: state.employees.map((e) =>
              e.id === employeeId
                ? { ...e, currentStatus: newStatus, currentOwner: owner, updatedAt: nowISO() }
                : e,
            ),
          }));
        },

        submitTraining: (employeeId: string, training: TrainingInput, remark?: string) => {
          const user = get().currentUser;
          const employee = get().employees.find((e) => e.id === employeeId);
          if (!employee) return;

          const existing = get().trainingRecords.find((t) => t.employeeId === employeeId);
          const trainingDate = nowISO().slice(0, 10);
          const newRecord: TrainingRecord = {
            id: existing?.id ?? uid('tr_'),
            employeeId,
            safetyTraining: training.safetyTraining,
            companyRules: training.companyRules,
            positionSkill: training.positionSkill,
            emergencyProcedure: training.emergencyProcedure,
            trainingResult: training.trainingResult,
            trainingRemark: training.trainingRemark,
            trainer: user.name,
            trainingDate,
          };

          set((state) => ({
            trainingRecords: existing
              ? state.trainingRecords.map((t) => (t.id === existing.id ? newRecord : t))
              : [...state.trainingRecords, newRecord],
          }));

          if (training.trainingResult === 'passed') {
            get().updateEmployeeStatus(employeeId, 'pending_documents', remark ?? training.trainingRemark);
          } else if (training.trainingResult === 'failed') {
            get().updateEmployeeStatus(employeeId, 'training_exception', remark ?? training.trainingRemark);
          }
        },

        batchSubmitTraining: (employeeIds: string[], remark?: string) => {
          employeeIds.forEach((id) => {
            const existing = get().trainingRecords.find((t) => t.employeeId === id);
            const input: TrainingInput = {
              safetyTraining: existing?.safetyTraining ?? true,
              companyRules: existing?.companyRules ?? true,
              positionSkill: existing?.positionSkill ?? true,
              emergencyProcedure: existing?.emergencyProcedure ?? true,
              trainingResult: 'passed',
              trainingRemark: remark ?? '批量确认培训通过',
            };
            get().submitTraining(id, input, remark);
          });
          set({ selectedEmployeeIds: [] });
        },

        updateDocument: (employeeId: string, docType: DocumentType, collected: boolean, remark?: string) => {
          const user = get().currentUser;
          const target = get().documents.find((d) => d.employeeId === employeeId && d.documentType === docType);
          if (!target) return;

          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === target.id
                ? {
                    ...d,
                    collected,
                    collectedDate: collected ? nowISO().slice(0, 10) : undefined,
                    remark: remark ?? d.remark,
                    updatedBy: user.name,
                    updatedAt: nowISO(),
                  }
                : d,
            ),
          }));

          const employeeDocs = get().documents.filter((d) => d.employeeId === employeeId);
          const allCollected = employeeDocs.every((d) => d.collected);
          const anyCollected = employeeDocs.some((d) => d.collected);
          const emp = get().employees.find((e) => e.id === employeeId);
          if (!emp) return;

          if (allCollected && emp.currentStatus !== 'completed') {
            get().updateEmployeeStatus(employeeId, 'completed', '证件收集齐全，进入薪酬复核');
          } else if (!allCollected && anyCollected && emp.currentStatus === 'pending_documents') {
            get().updateEmployeeStatus(employeeId, 'collecting_documents', remark);
          } else if (!anyCollected && emp.currentStatus === 'collecting_documents') {
            get().updateEmployeeStatus(employeeId, 'pending_documents', remark);
          }
        },

        addRiskFlag: (employeeId: string, flagType: RiskFlagType, description: string) => {
          const user = get().currentUser;
          const flag: RiskFlag = {
            id: uid('rf_'),
            employeeId,
            flagType,
            description,
            active: true,
            flaggedBy: user.name,
            flaggedByRole: user.role,
            flaggedAt: nowISO(),
          };
          set((state) => ({ riskFlags: [...state.riskFlags, flag] }));
        },

        resolveRiskFlag: (flagId: string, remark: string) => {
          set((state) => ({
            riskFlags: state.riskFlags.map((f) =>
              f.id === flagId
                ? { ...f, active: false, resolvedRemark: remark, resolvedAt: nowISO() }
                : f,
            ),
          }));
        },

        toggleEmployeeSelection: (employeeId: string) => {
          set((state) => ({
            selectedEmployeeIds: state.selectedEmployeeIds.includes(employeeId)
              ? state.selectedEmployeeIds.filter((id) => id !== employeeId)
              : [...state.selectedEmployeeIds, employeeId],
          }));
        },

        setEmployeeSelection: (ids: string[]) => {
          set({ selectedEmployeeIds: ids });
        },

        clearSelection: () => {
          set({ selectedEmployeeIds: [] });
        },

        setFilters: (newFilters: Partial<Filters>) => {
          set((state) => ({ filters: { ...state.filters, ...newFilters } }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },

        resetAllData: () => {
          const fresh = buildInitialData();
          set({
            employees: fresh.employees,
            statusLogs: fresh.statusLogs,
            trainingRecords: fresh.trainingRecords,
            documents: fresh.documents,
            riskFlags: fresh.riskFlags,
            selectedEmployeeIds: [],
            filters: {},
          });
        },
      };
    },
    {
      name: 'dispatch-training-store',
    },
  ),
);

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 个月前`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getEmployeeTraining(employeeId: string): TrainingRecord | undefined {
  return useStore.getState().trainingRecords.find((t) => t.employeeId === employeeId);
}

export function getEmployeeLogs(employeeId: string): StatusLog[] {
  return useStore
    .getState()
    .statusLogs.filter((l) => l.employeeId === employeeId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getEmployeeDocuments(employeeId: string): DocumentItem[] {
  return useStore.getState().documents.filter((d) => d.employeeId === employeeId);
}

export function getEmployeeActiveRisks(employeeId: string): RiskFlag[] {
  return useStore.getState().riskFlags.filter((f) => f.employeeId === employeeId && f.active);
}

export function getEmployeeAllRisks(employeeId: string): RiskFlag[] {
  return useStore
    .getState()
    .riskFlags.filter((f) => f.employeeId === employeeId)
    .sort((a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime());
}
