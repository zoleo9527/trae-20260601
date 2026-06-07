import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import {
  Store,
  Product,
  User,
  InventoryDifference,
  LossRecord,
  Alert,
  InventoryDifferenceStatus,
  LossAnalysisStatus,
  AlertStatus,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  PaginatedResponse,
  PaginationParams,
  DifferenceHistoryItem,
  AnalysisHistoryItem,
  DifferenceType,
  LossType,
} from '@/types';
import {
  mockStores,
  mockProducts,
  mockUsers,
  mockInventoryDifferences,
  mockLossRecords,
  mockAlerts,
} from '@/data/mockData';

const generateId = () => Math.random().toString(36).substring(2, 10);

interface StoreState {
  stores: Store[];
  products: Product[];
  users: User[];
  currentUser: User;
  inventoryDifferences: InventoryDifference[];
  lossRecords: LossRecord[];
  alerts: Alert[];

  setCurrentUser: (user: User) => void;
  switchRole: (role: User['role']) => void;

  getInventoryDifferences: (
    pagination: PaginationParams,
    filters?: DifferenceFilterParams
  ) => PaginatedResponse<InventoryDifference>;
  getInventoryDifferenceById: (id: string) => InventoryDifference | undefined;
  updateDifferenceStatus: (
    id: string,
    status: InventoryDifferenceStatus,
    remark?: string
  ) => void;
  addDifferenceHistory: (
    differenceId: string,
    action: string,
    content: string
  ) => void;

  getLossRecords: (
    pagination: PaginationParams,
    filters?: LossFilterParams
  ) => PaginatedResponse<LossRecord>;
  getLossRecordById: (id: string) => LossRecord | undefined;
  updateLossStatus: (
    id: string,
    status: LossAnalysisStatus,
    analysisData?: Partial<LossRecord['analysis']>
  ) => void;
  addAnalysisHistory: (
    lossId: string,
    action: string,
    content: string
  ) => void;

  getAlerts: (
    pagination: PaginationParams,
    filters?: AlertFilterParams
  ) => PaginatedResponse<Alert>;
  getActiveAlerts: () => Alert[];
  updateAlertStatus: (
    id: string,
    status: AlertStatus,
    resolution?: string
  ) => void;

  getDashboardStats: () => {
    totalDifferences: number;
    pendingDifferences: number;
    totalLoss: number;
    activeAlerts: number;
    criticalAlerts: number;
  };

  getLossTrendData: () => Array<{ date: string; amount: number; count: number }>;
  getLossTypeDistribution: () => Array<{ type: string; value: number; name: string }>;
  getDifferenceTypeDistribution: () => Array<{ type: string; value: number; name: string }>;
}

const getCurrentUserByRole = (role: User['role']): User => {
  switch (role) {
    case 'store_manager':
      return mockUsers[0];
    case 'supervisor':
      return mockUsers[2];
    case 'product_specialist':
      return mockUsers[3];
    default:
      return mockUsers[0];
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stores: mockStores,
      products: mockProducts,
      users: mockUsers,
      currentUser: getCurrentUserByRole('store_manager'),
      inventoryDifferences: mockInventoryDifferences,
      lossRecords: mockLossRecords,
      alerts: mockAlerts,

      setCurrentUser: (user) => set({ currentUser: user }),

      switchRole: (role) => {
        set({ currentUser: getCurrentUserByRole(role) });
      },

      getInventoryDifferences: (pagination, filters) => {
        const { page, pageSize } = pagination;
        let data = [...get().inventoryDifferences];
        const currentUser = get().currentUser;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          data = data.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          data = data.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        if (filters) {
          if (filters.storeId) {
            data = data.filter((d) => d.storeId === filters.storeId);
          }
          if (filters.status) {
            data = data.filter((d) => d.status === filters.status);
          }
          if (filters.differenceType) {
            data = data.filter((d) => d.differenceType === filters.differenceType);
          }
          if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            data = data.filter(
              (d) =>
                d.productName.toLowerCase().includes(keyword) ||
                d.differenceNo.toLowerCase().includes(keyword) ||
                d.storeName.toLowerCase().includes(keyword)
            );
          }
          if (filters.dateRange) {
            const [start, end] = filters.dateRange;
            data = data.filter(
              (d) =>
                dayjs(d.reportedAt).isAfter(dayjs(start).startOf('day')) &&
                dayjs(d.reportedAt).isBefore(dayjs(end).endOf('day'))
            );
          }
        }

        const total = data.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedData = data.slice(startIndex, startIndex + pageSize);

        return {
          data: paginatedData,
          total,
          page,
          pageSize,
        };
      },

      getInventoryDifferenceById: (id) => {
        return get().inventoryDifferences.find((d) => d.id === id);
      },

      updateDifferenceStatus: (id, status, remark) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const currentUser = get().currentUser;

        set((state) => ({
          inventoryDifferences: state.inventoryDifferences.map((d) => {
            if (d.id !== id) return d;

            const historyItem: DifferenceHistoryItem = {
              id: generateId(),
              differenceId: id,
              timestamp: now,
              operator: currentUser.name,
              action: `状态变更: ${d.status} → ${status}`,
              content: remark || `状态更新为${status}`,
            };

            return {
              ...d,
              status,
              handler: currentUser.name,
              handledAt: now,
              resolution: remark || d.resolution,
              history: [...d.history, historyItem],
            };
          }),
        }));
      },

      addDifferenceHistory: (differenceId, action, content) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const currentUser = get().currentUser;

        const historyItem: DifferenceHistoryItem = {
          id: generateId(),
          differenceId,
          timestamp: now,
          operator: currentUser.name,
          action,
          content,
        };

        set((state) => ({
          inventoryDifferences: state.inventoryDifferences.map((d) =>
            d.id === differenceId
              ? { ...d, history: [...d.history, historyItem] }
              : d
          ),
        }));
      },

      getLossRecords: (pagination, filters) => {
        const { page, pageSize } = pagination;
        let data = [...get().lossRecords];
        const currentUser = get().currentUser;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          data = data.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          data = data.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        if (filters) {
          if (filters.storeId) {
            data = data.filter((d) => d.storeId === filters.storeId);
          }
          if (filters.status) {
            data = data.filter((d) => d.status === filters.status);
          }
          if (filters.lossType) {
            data = data.filter((d) => d.lossType === filters.lossType);
          }
          if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            data = data.filter(
              (d) =>
                d.productName.toLowerCase().includes(keyword) ||
                d.lossNo.toLowerCase().includes(keyword) ||
                d.storeName.toLowerCase().includes(keyword)
            );
          }
          if (filters.dateRange) {
            const [start, end] = filters.dateRange;
            data = data.filter(
              (d) =>
                dayjs(d.reportedAt).isAfter(dayjs(start).startOf('day')) &&
                dayjs(d.reportedAt).isBefore(dayjs(end).endOf('day'))
            );
          }
        }

        const total = data.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedData = data.slice(startIndex, startIndex + pageSize);

        return {
          data: paginatedData,
          total,
          page,
          pageSize,
        };
      },

      getLossRecordById: (id) => {
        return get().lossRecords.find((d) => d.id === id);
      },

      updateLossStatus: (id, status, analysisData) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const currentUser = get().currentUser;

        set((state) => ({
          lossRecords: state.lossRecords.map((loss) => {
            if (loss.id !== id) return loss;

            const historyItem: AnalysisHistoryItem = {
              id: generateId(),
              analysisId: loss.analysis?.id || generateId(),
              timestamp: now,
              operator: currentUser.name,
              action: `状态变更: ${loss.status} → ${status}`,
              content: `状态更新为${status}`,
            };

            const existingAnalysis = loss.analysis || {
              id: generateId(),
              lossId: id,
              analyst: currentUser.name,
              analyzedAt: now,
              rootCause: '',
              preventiveMeasure: '',
              responsibleParty: '',
              conclusion: '',
              history: [],
            };

            return {
              ...loss,
              status,
              analysis: {
                ...existingAnalysis,
                ...analysisData,
                analyst: currentUser.name,
                analyzedAt: now,
                history: [...existingAnalysis.history, historyItem],
              },
            };
          }),
        }));
      },

      addAnalysisHistory: (lossId, action, content) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const currentUser = get().currentUser;

        set((state) => ({
          lossRecords: state.lossRecords.map((loss) => {
            if (loss.id !== lossId) return loss;

            const analysisId = loss.analysis?.id || generateId();
            const historyItem: AnalysisHistoryItem = {
              id: generateId(),
              analysisId,
              timestamp: now,
              operator: currentUser.name,
              action,
              content,
            };

            const existingAnalysis = loss.analysis || {
              id: analysisId,
              lossId,
              analyst: currentUser.name,
              analyzedAt: now,
              rootCause: '',
              preventiveMeasure: '',
              responsibleParty: '',
              conclusion: '',
              history: [],
            };

            return {
              ...loss,
              analysis: {
                ...existingAnalysis,
                history: [...existingAnalysis.history, historyItem],
              },
            };
          }),
        }));
      },

      getAlerts: (pagination, filters) => {
        const { page, pageSize } = pagination;
        let data = [...get().alerts];
        const currentUser = get().currentUser;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          data = data.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          data = data.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        if (filters) {
          if (filters.storeId) {
            data = data.filter((d) => d.storeId === filters.storeId);
          }
          if (filters.status) {
            data = data.filter((d) => d.status === filters.status);
          }
          if (filters.alertType) {
            data = data.filter((d) => d.alertType === filters.alertType);
          }
          if (filters.severity) {
            data = data.filter((d) => d.severity === filters.severity);
          }
          if (filters.dateRange) {
            const [start, end] = filters.dateRange;
            data = data.filter(
              (d) =>
                dayjs(d.createdAt).isAfter(dayjs(start).startOf('day')) &&
                dayjs(d.createdAt).isBefore(dayjs(end).endOf('day'))
            );
          }
        }

        data.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const statusOrder = { active: 0, processing: 1, resolved: 2, ignored: 3 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return severityOrder[a.severity] - severityOrder[b.severity];
        });

        const total = data.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedData = data.slice(startIndex, startIndex + pageSize);

        return {
          data: paginatedData,
          total,
          page,
          pageSize,
        };
      },

      getActiveAlerts: () => {
        const data = get().alerts.filter(
          (a) => a.status === 'active' || a.status === 'processing'
        );
        const currentUser = get().currentUser;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          return data.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          return data.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        return data;
      },

      updateAlertStatus: (id, status, resolution) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const currentUser = get().currentUser;

        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id
              ? {
                  ...alert,
                  status,
                  assignee: currentUser.name,
                  handledAt: status === 'resolved' || status === 'ignored' ? now : alert.handledAt,
                  resolution: resolution || alert.resolution,
                }
              : alert
          ),
        }));
      },

      getDashboardStats: () => {
        const differences = get().inventoryDifferences;
        const losses = get().lossRecords;
        const alerts = get().alerts;
        const currentUser = get().currentUser;

        let filteredDifferences = differences;
        let filteredLosses = losses;
        let filteredAlerts = alerts;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          filteredDifferences = differences.filter((d) => d.storeId === currentUser.storeId);
          filteredLosses = losses.filter((d) => d.storeId === currentUser.storeId);
          filteredAlerts = alerts.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          filteredDifferences = differences.filter((d) => currentUser.storeIds!.includes(d.storeId));
          filteredLosses = losses.filter((d) => currentUser.storeIds!.includes(d.storeId));
          filteredAlerts = alerts.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        return {
          totalDifferences: filteredDifferences.length,
          pendingDifferences: filteredDifferences.filter((d) => d.status === 'pending').length,
          totalLoss: filteredLosses.reduce((sum, l) => sum + l.lossAmount, 0),
          activeAlerts: filteredAlerts.filter((a) => a.status === 'active').length,
          criticalAlerts: filteredAlerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
        };
      },

      getLossTrendData: () => {
        const losses = get().lossRecords;
        const currentUser = get().currentUser;
        let filteredLosses = losses;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          filteredLosses = losses.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          filteredLosses = losses.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        const last7Days = Array.from({ length: 7 }, (_, i) =>
          dayjs().subtract(6 - i, 'day').format('MM-DD')
        );

        return last7Days.map((date) => {
          const dayLosses = filteredLosses.filter((l) =>
            dayjs(l.reportedAt).format('MM-DD') === date
          );
          return {
            date,
            amount: dayLosses.reduce((sum, l) => sum + l.lossAmount, 0),
            count: dayLosses.length,
          };
        });
      },

      getLossTypeDistribution: () => {
        const losses = get().lossRecords;
        const currentUser = get().currentUser;
        let filteredLosses = losses;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          filteredLosses = losses.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          filteredLosses = losses.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        const typeMap: Record<LossType, string> = {
          expired: '过期损耗',
          damaged: '破损损耗',
          stolen: '偷盗损耗',
          other: '其他损耗',
        };

        const distribution: Record<string, number> = {};
        filteredLosses.forEach((l) => {
          const key = typeMap[l.lossType];
          distribution[key] = (distribution[key] || 0) + l.lossAmount;
        });

        return Object.entries(distribution).map(([type, value]) => ({
          type,
          value,
          name: type,
        }));
      },

      getDifferenceTypeDistribution: () => {
        const differences = get().inventoryDifferences;
        const currentUser = get().currentUser;
        let filteredDifferences = differences;

        if (currentUser.role === 'store_manager' && currentUser.storeId) {
          filteredDifferences = differences.filter((d) => d.storeId === currentUser.storeId);
        } else if (currentUser.role === 'supervisor' && currentUser.storeIds) {
          filteredDifferences = differences.filter((d) => currentUser.storeIds!.includes(d.storeId));
        }

        const typeMap: Record<DifferenceType, string> = {
          overage: '溢余',
          shortage: '短缺',
          price_mismatch: '价签错误',
        };

        const distribution: Record<string, number> = {};
        filteredDifferences.forEach((d) => {
          const key = typeMap[d.differenceType];
          distribution[key] = (distribution[key] || 0) + d.differenceAmount;
        });

        return Object.entries(distribution).map(([type, value]) => ({
          type,
          value,
          name: type,
        }));
      },
    }),
    {
      name: 'convenience-store-inventory',
      partialize: (state) => ({
        inventoryDifferences: state.inventoryDifferences,
        lossRecords: state.lossRecords,
        alerts: state.alerts,
        currentUser: state.currentUser,
      }),
    }
  )
);
