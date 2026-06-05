import { create } from 'zustand';

export interface RiskItem {
  id: string;
  type: 'anomaly_score' | 'expired_inventory' | 'version_conflict';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  linkTo?: string;
}

export interface RecentChange {
  id: string;
  module: string;
  action: string;
  operator: string;
  target: string;
  timestamp: string;
}

export interface DashboardData {
  pendingCounts: {
    curves: number;
    cuppingScores: number;
    complaints: number;
  };
  riskItems: RiskItem[];
  recentChanges: RecentChange[];
}

export interface RoastCurveVersion {
  id: string;
  version: number;
  chargeTemp: number;
  turningPoint: number;
  turningPointTime: number;
  firstCrackTemp: number;
  firstCrackTime: number;
  developmentTime: number;
  dropTemp: number;
  status: 'draft' | 'active' | 'deprecated';
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export interface RoastCurve {
  id: string;
  beanType: string;
  roastLevel: string;
  currentVersion: number;
  status: 'draft' | 'active' | 'deprecated';
  createdBy: string;
  updatedAt: string;
  versions?: RoastCurveVersion[];
  relatedScores?: CuppingScore[];
  relatedBatches?: InventoryItem[];
}

export interface CuppingScore {
  id: string;
  beanType: string;
  batchCode: string;
  totalScore: number;
  isAnomaly: boolean;
  anomalyDescription?: string;
  cupper: string;
  cuppingDate: string;
  dryAroma: number;
  wetAroma: number;
  acidity: number;
  body: number;
  aftertaste: number;
  balance: number;
  overall: number;
  curveId?: number;
  curveVersionId?: number;
  relatedCurve?: RoastCurve;
  relatedBatch?: InventoryItem;
  curveVersion?: any;
  batch?: any;
}

export interface Complaint {
  id: string;
  customer: string;
  channel: string;
  content: string;
  status: 'pending' | 'processing' | 'resolved';
  linkedCurveId?: string;
  linkedScoreId?: string;
  handler: string;
  createdAt: string;
  curveId?: number;
  cuppingScoreId?: number;
  batchCode?: string;
  curve?: any;
  cuppingScore?: any;
}

export interface InventoryItem {
  id: string;
  batchCode: string;
  beanType: string;
  quantity: number;
  remaining: number;
  roastDate: string;
  expiryDate: string;
  fifoStatus: 'normal' | 'warning' | 'expired';
  curveId?: string;
  daysUntilExpiry?: number;
  roastLevel?: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  operator: string;
  target: string;
  detail: string;
}

export interface RoastCurveFilters {
  beanType: string;
  status: string;
  keyword: string;
}

export interface CuppingScoreFilters {
  beanType: string;
  anomalyOnly: boolean;
  dateFrom: string;
  dateTo: string;
}

export interface OperationLogFilters {
  module: string;
  operator: string;
  dateFrom: string;
  dateTo: string;
}

interface AppState {
  dashboard: DashboardData | null;
  roastCurves: RoastCurve[];
  selectedCurve: RoastCurve | null;
  cuppingScores: CuppingScore[];
  selectedScore: CuppingScore | null;
  complaints: Complaint[];
  inventory: InventoryItem[];
  operationLogs: OperationLog[];
  curvesForSelect: RoastCurve[];
  cuppingHistory: CuppingScore[];
  loading: {
    dashboard: boolean;
    roastCurves: boolean;
    selectedCurve: boolean;
    cuppingScores: boolean;
    selectedScore: boolean;
    complaints: boolean;
    inventory: boolean;
    operationLogs: boolean;
  };
  curveFilters: RoastCurveFilters;
  cuppingFilters: CuppingScoreFilters;
  logFilters: OperationLogFilters;
  complaintsTab: 'complaints' | 'inventory';

  setCurveFilters: (filters: Partial<RoastCurveFilters>) => void;
  setCuppingFilters: (filters: Partial<CuppingScoreFilters>) => void;
  setLogFilters: (filters: Partial<OperationLogFilters>) => void;
  setComplaintsTab: (tab: 'complaints' | 'inventory') => void;

  fetchDashboard: () => Promise<void>;
  fetchRoastCurves: () => Promise<void>;
  fetchRoastCurveDetail: (id: string) => Promise<void>;
  fetchCuppingScores: () => Promise<void>;
  fetchCuppingScoreDetail: (id: string) => Promise<void>;
  fetchComplaints: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchOperationLogs: () => Promise<void>;
  fetchCurvesForSelect: () => Promise<void>;
  fetchCuppingHistory: (curveId: string) => Promise<void>;

  createCurve: (data: { bean_type: string; roast_level: string; created_by: string; version?: any }) => Promise<void>;
  activateVersion: (curveId: string, ver: number, operator: string) => Promise<void>;
  newVersion: (curveId: string, data: { version: any; created_by: string }) => Promise<void>;
  createCuppingScore: (data: any) => Promise<void>;
  updateComplaint: (id: string, data: { status: string; handler?: string; operator?: string }) => Promise<void>;
  updateInventory: (id: string, data: { status: string; operator?: string }) => Promise<void>;
  resetData: () => Promise<void>;
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

async function apiPut<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

function mapCurveRow(row: any): RoastCurve {
  return {
    id: String(row.id),
    beanType: row.bean_type,
    roastLevel: row.roast_level,
    currentVersion: row.current_version ?? row.latest_version ?? 1,
    status: row.status,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  };
}

function mapVersionRow(row: any): RoastCurveVersion {
  return {
    id: String(row.id),
    version: row.version_number,
    chargeTemp: row.charge_temp,
    turningPoint: row.turn_point_temp,
    turningPointTime: row.turn_point_time,
    firstCrackTemp: row.first_crack_temp,
    firstCrackTime: row.first_crack_time,
    developmentTime: row.development_time,
    dropTemp: row.drop_temp,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

function mapScoreRow(row: any): CuppingScore {
  return {
    id: String(row.id),
    beanType: row.bean_type,
    batchCode: row.batch_code,
    totalScore: row.total_score,
    isAnomaly: !!row.flavor_anomaly,
    anomalyDescription: row.anomaly_description,
    cupper: row.cupper_name,
    cuppingDate: row.cupped_at,
    dryAroma: row.dry_aroma,
    wetAroma: row.wet_aroma,
    acidity: row.acidity,
    body: row.body,
    aftertaste: row.aftertaste,
    balance: row.balance,
    overall: row.overall,
    curveId: row.curve_id,
    curveVersionId: row.curve_version_id,
  };
}

function mapComplaintRow(row: any): Complaint {
  return {
    id: String(row.id),
    customer: row.customer_name,
    channel: row.channel,
    content: row.content,
    status: row.status,
    linkedCurveId: row.curve_id ? String(row.curve_id) : undefined,
    linkedScoreId: row.cupping_score_id ? String(row.cupping_score_id) : undefined,
    handler: row.handler ?? '',
    createdAt: row.created_at,
    curveId: row.curve_id,
    cuppingScoreId: row.cupping_score_id,
    batchCode: row.batch_code,
    curve: row.curve,
    cuppingScore: row.cuppingScore,
  };
}

function mapInventoryRow(row: any): InventoryItem {
  return {
    id: String(row.id),
    batchCode: row.batch_code,
    beanType: row.bean_type ?? row.curve_bean_type,
    quantity: row.quantity_kg,
    remaining: row.remaining_kg,
    roastDate: row.roast_date,
    expiryDate: row.expiry_date,
    fifoStatus: row.fifoStatus ?? (row.status === 'expired' ? 'expired' : row.status === 'near_expiry' ? 'warning' : 'normal'),
    curveId: row.curve_id ? String(row.curve_id) : undefined,
    daysUntilExpiry: row.daysUntilExpiry,
    roastLevel: row.roast_level,
  };
}

function mapLogRow(row: any): OperationLog {
  return {
    id: String(row.id),
    timestamp: row.created_at,
    module: row.module,
    action: row.action,
    operator: row.operator,
    target: `${row.target_type}#${row.target_id}`,
    detail: row.detail ?? '',
  };
}

export const useStore = create<AppState>((set, get) => ({
  dashboard: null,
  roastCurves: [],
  selectedCurve: null,
  cuppingScores: [],
  selectedScore: null,
  complaints: [],
  inventory: [],
  operationLogs: [],
  curvesForSelect: [],
  cuppingHistory: [],
  loading: {
    dashboard: false,
    roastCurves: false,
    selectedCurve: false,
    cuppingScores: false,
    selectedScore: false,
    complaints: false,
    inventory: false,
    operationLogs: false,
  },
  curveFilters: { beanType: '', status: '', keyword: '' },
  cuppingFilters: { beanType: '', anomalyOnly: false, dateFrom: '', dateTo: '' },
  logFilters: { module: '', operator: '', dateFrom: '', dateTo: '' },
  complaintsTab: 'complaints',

  setCurveFilters: (filters) =>
    set((s) => ({ curveFilters: { ...s.curveFilters, ...filters } })),
  setCuppingFilters: (filters) =>
    set((s) => ({ cuppingFilters: { ...s.cuppingFilters, ...filters } })),
  setLogFilters: (filters) =>
    set((s) => ({ logFilters: { ...s.logFilters, ...filters } })),
  setComplaintsTab: (tab) => set({ complaintsTab: tab }),

  fetchDashboard: async () => {
    set((s) => ({ loading: { ...s.loading, dashboard: true } }));
    try {
      const raw = await apiFetch<any>('/api/dashboard');
      const riskItems: RiskItem[] = [];
      if (raw.risks?.anomalyScores) {
        for (const s of raw.risks.anomalyScores) {
          riskItems.push({
            id: `anomaly-${s.id}`,
            type: 'anomaly_score',
            title: `${s.bean_type} 杯测异常`,
            description: s.anomaly_description ?? '风味异常',
            severity: s.total_score < 35 ? 'high' : 'medium',
            linkTo: `/cupping-scores/${s.id}`,
          });
        }
      }
      if (raw.risks?.expiredBatches > 0) {
        riskItems.push({
          id: 'expired-inventory',
          type: 'expired_inventory',
          title: `${raw.risks.expiredBatches} 批库存已过期`,
          description: '存在已过期库存批次，请立即处理',
          severity: 'high',
          linkTo: '/complaints-inventory',
        });
      }
      if (raw.risks?.nearExpiryBatches > 0) {
        riskItems.push({
          id: 'near-expiry-inventory',
          type: 'expired_inventory',
          title: `${raw.risks.nearExpiryBatches} 批库存临期`,
          description: '存在临近过期库存，请关注先进先出',
          severity: 'medium',
          linkTo: '/complaints-inventory',
        });
      }
      if (raw.risks?.versionConflicts?.length > 0) {
        for (const vc of raw.risks.versionConflicts) {
          riskItems.push({
            id: `vc-${vc.id}`,
            type: 'version_conflict',
            title: `${vc.bean_type} 存在未启用的新版本`,
            description: `当前启用 v${vc.current_version}，有草稿版本待确认`,
            severity: 'low',
            linkTo: `/roast-curves/${vc.id}`,
          });
        }
      }
      riskItems.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      });
      const recentChanges: RecentChange[] = (raw.recentChanges ?? []).map((r: any) => ({
        id: String(r.id),
        module: r.module,
        action: r.action,
        operator: r.operator,
        target: r.detail ?? '',
        timestamp: r.created_at,
      }));
      set({
        dashboard: {
          pendingCounts: {
            curves: raw.pending?.draftCurves ?? 0,
            cuppingScores: raw.pending?.anomalyScores ?? 0,
            complaints: (raw.pending?.pendingComplaints ?? 0) + (raw.pending?.processingComplaints ?? 0),
          },
          riskItems,
          recentChanges,
        },
      });
    } finally {
      set((s) => ({ loading: { ...s.loading, dashboard: false } }));
    }
  },

  fetchRoastCurves: async () => {
    set((s) => ({ loading: { ...s.loading, roastCurves: true } }));
    try {
      const rows = await apiFetch<any[]>('/api/roast-curves');
      set({ roastCurves: rows.map(mapCurveRow) });
    } finally {
      set((s) => ({ loading: { ...s.loading, roastCurves: false } }));
    }
  },

  fetchRoastCurveDetail: async (id) => {
    set((s) => ({ loading: { ...s.loading, selectedCurve: true } }));
    try {
      const raw = await apiFetch<any>(`/api/roast-curves/${id}`);
      const curve = mapCurveRow(raw);
      curve.versions = (raw.versions ?? []).map(mapVersionRow);
      curve.relatedScores = (raw.cuppingScores ?? []).map(mapScoreRow);
      curve.relatedBatches = (raw.batches ?? []).map(mapInventoryRow);
      set({ selectedCurve: curve });
    } finally {
      set((s) => ({ loading: { ...s.loading, selectedCurve: false } }));
    }
  },

  fetchCuppingScores: async () => {
    set((s) => ({ loading: { ...s.loading, cuppingScores: true } }));
    try {
      const rows = await apiFetch<any[]>('/api/cupping-scores');
      set({ cuppingScores: rows.map(mapScoreRow) });
    } finally {
      set((s) => ({ loading: { ...s.loading, cuppingScores: false } }));
    }
  },

  fetchCuppingScoreDetail: async (id) => {
    set((s) => ({ loading: { ...s.loading, selectedScore: true } }));
    try {
      const raw = await apiFetch<any>(`/api/cupping-scores/${id}`);
      const score = mapScoreRow(raw);
      if (raw.curveVersion) {
        score.curveVersion = raw.curveVersion;
      }
      if (raw.batch) {
        score.batch = raw.batch;
      }
      if (raw.bean_type) {
        score.beanType = raw.bean_type;
      }
      if (raw.roast_level) {
        (score as any).roastLevel = raw.roast_level;
      }
      if (raw.curve_status) {
        (score as any).curveStatus = raw.curve_status;
      }
      set({ selectedScore: score });
    } finally {
      set((s) => ({ loading: { ...s.loading, selectedScore: false } }));
    }
  },

  fetchComplaints: async () => {
    set((s) => ({ loading: { ...s.loading, complaints: true } }));
    try {
      const rows = await apiFetch<any[]>('/api/complaints');
      set({ complaints: rows.map(mapComplaintRow) });
    } finally {
      set((s) => ({ loading: { ...s.loading, complaints: false } }));
    }
  },

  fetchInventory: async () => {
    set((s) => ({ loading: { ...s.loading, inventory: true } }));
    try {
      const rows = await apiFetch<any[]>('/api/inventory');
      set({ inventory: rows.map(mapInventoryRow) });
    } finally {
      set((s) => ({ loading: { ...s.loading, inventory: false } }));
    }
  },

  fetchOperationLogs: async () => {
    set((s) => ({ loading: { ...s.loading, operationLogs: true } }));
    try {
      const raw = await apiFetch<any>('/api/operation-logs');
      const rows = raw.items ?? raw;
      set({ operationLogs: (Array.isArray(rows) ? rows : []).map(mapLogRow) });
    } finally {
      set((s) => ({ loading: { ...s.loading, operationLogs: false } }));
    }
  },

  fetchCurvesForSelect: async () => {
    try {
      const rows = await apiFetch<any[]>('/api/roast-curves');
      set({ curvesForSelect: rows.map(mapCurveRow) });
    } catch {}
  },

  fetchCuppingHistory: async (curveId) => {
    try {
      const rows = await apiFetch<any[]>(`/api/cupping-scores?curveId=${curveId}`);
      set({ cuppingHistory: rows.map(mapScoreRow) });
    } catch {
      set({ cuppingHistory: [] });
    }
  },

  createCurve: async (data) => {
    await apiPost('/api/roast-curves', data);
    await get().fetchRoastCurves();
    await get().fetchDashboard();
  },

  activateVersion: async (curveId, ver, operator) => {
    await apiPut(`/api/roast-curves/${curveId}/version/${ver}/activate`, { operator });
    await get().fetchRoastCurveDetail(curveId);
    await get().fetchDashboard();
  },

  newVersion: async (curveId, data) => {
    await apiPut(`/api/roast-curves/${curveId}`, {
      created_by: data.created_by,
      version: data.version,
    });
    await get().fetchRoastCurveDetail(curveId);
    await get().fetchDashboard();
  },

  createCuppingScore: async (data) => {
    await apiPost('/api/cupping-scores', data);
    await get().fetchCuppingScores();
    await get().fetchDashboard();
  },

  updateComplaint: async (id, data) => {
    await apiPut(`/api/complaints/${id}`, data);
    await get().fetchComplaints();
    await get().fetchDashboard();
  },

  updateInventory: async (id, data) => {
    await apiPut(`/api/inventory/${id}`, data);
    await get().fetchInventory();
    await get().fetchDashboard();
  },

  resetData: async () => {
    await apiPost('/api/reset-data', {});
    await get().fetchDashboard();
  },
}));
