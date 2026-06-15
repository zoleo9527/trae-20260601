import type {
  User,
  CustomerDraft,
  PrintSchedule,
  MaterialPickup,
  InstallationRecord,
  AuditLog,
  ExceptionRecord,
} from '@/types';

const STORAGE_KEY = 'print-shop-data-v1';

export interface PersistedData {
  currentUserId: string;
  users: User[];
  drafts: CustomerDraft[];
  schedules: PrintSchedule[];
  materialPickups: MaterialPickup[];
  installations: InstallationRecord[];
  auditLogs: AuditLog[];
  exceptions: ExceptionRecord[];
}

export function loadPersistedData(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedData;
    return parsed;
  } catch (e) {
    console.error('加载持久化数据失败:', e);
    return null;
  }
}

export function savePersistedData(data: PersistedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存持久化数据失败:', e);
  }
}

export function clearPersistedData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
