import dayjs from 'dayjs';
import {
  InventoryDifference,
  LossRecord,
  Alert,
  PaginationParams,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  User,
  DifferenceType,
  LossType,
  DifferenceHistoryItem,
  AnalysisHistoryItem,
} from '@/types';
import {
  mockInventoryDifferences,
  mockLossRecords,
  mockAlerts,
  mockUsers,
} from '@/data/mockData';
import {
  ApiResponse,
  UpdateDifferenceStatusRequest,
  UpdateLossStatusRequest,
  UpdateAlertStatusRequest,
  IDifferenceApi,
  ILossApi,
  IAlertApi,
  IDashboardApi,
} from './types';
import {
  canTransitionDifference,
  canTransitionLoss,
  validateDifferenceLossLink,
} from './stateConstraints';

const generateId = () => Math.random().toString(36).substring(2, 10);

let currentUser: User = mockUsers[0];

export const setCurrentApiUser = (user: User) => {
  currentUser = user;
};

const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const wrapResponse = <T>(data: T, code = 0, message = 'success'): ApiResponse<T> => ({
  code,
  message,
  data,
});

const filterByRole = <T extends { storeId: string }>(data: T[], user: User): T[] => {
  if (user.role === 'store_manager' && user.storeId) {
    return data.filter((d) => d.storeId === user.storeId);
  }
  if (user.role === 'supervisor' && user.storeIds) {
    return data.filter((d) => user.storeIds!.includes(d.storeId));
  }
  return data;
};

let inventoryDifferences = [...mockInventoryDifferences];
let lossRecords = [...mockLossRecords];
let alerts = [...mockAlerts];

export const differenceApi: IDifferenceApi = {
  getList: async (pagination: PaginationParams, filters?: DifferenceFilterParams) => {
    let data = [...inventoryDifferences];
    data = filterByRole(data, currentUser);

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
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pagination.pageSize);

    return delay(
      wrapResponse({
        data: paginatedData,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
    );
  },

  getById: async (id: string) => {
    const difference = inventoryDifferences.find((d) => d.id === id);
    if (!difference) {
      return delay(wrapResponse(null as any, 404, '盘点差异不存在'), 200);
    }
    return delay(wrapResponse(difference));
  },

  updateStatus: async (id: string, request: UpdateDifferenceStatusRequest) => {
    const index = inventoryDifferences.findIndex((d) => d.id === id);
    if (index === -1) {
      return delay(wrapResponse(null as any, 404, '盘点差异不存在'), 200);
    }

    const current = inventoryDifferences[index];
    
    if (!canTransitionDifference(current.status, request.status, currentUser.role)) {
      return delay(
        wrapResponse(null as any, 403, `当前角色无权限将状态从 ${current.status} 变更为 ${request.status}`),
        200
      );
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const historyItem: DifferenceHistoryItem = {
      id: generateId(),
      differenceId: id,
      timestamp: now,
      operator: currentUser.name,
      action: `状态变更: ${current.status} → ${request.status}`,
      content: request.remark || `状态更新为${request.status}`,
    };

    const updated: InventoryDifference = {
      ...current,
      status: request.status,
      handler: currentUser.name,
      handledAt: now,
      resolution: request.remark || current.resolution,
      history: [...current.history, historyItem],
    };

    if (request.relatedLossId) {
      const loss = lossRecords.find((l) => l.id === request.relatedLossId);
      if (loss) {
        const validation = validateDifferenceLossLink(updated, loss);
        if (!validation.valid) {
          return delay(wrapResponse(null as any, 400, validation.reason!), 200);
        }
        (updated as any).relatedLossIds = [
          ...((current as any).relatedLossIds || []),
          request.relatedLossId,
        ];
      }
    }

    inventoryDifferences[index] = updated;
    return delay(wrapResponse(updated));
  },

  linkLossRecord: async (differenceId: string, lossId: string) => {
    const diffIndex = inventoryDifferences.findIndex((d) => d.id === differenceId);
    const loss = lossRecords.find((l) => l.id === lossId);
    
    if (diffIndex === -1 || !loss) {
      return delay(wrapResponse(null as any, 404, '记录不存在'), 200);
    }

    const difference = inventoryDifferences[diffIndex];
    const validation = validateDifferenceLossLink(difference, loss);
    if (!validation.valid) {
      return delay(wrapResponse(null as any, 400, validation.reason!), 200);
    }

    const updated = {
      ...difference,
      relatedLossIds: [...((difference as any).relatedLossIds || []), lossId],
    };
    inventoryDifferences[diffIndex] = updated;

    return delay(wrapResponse(updated));
  },
};

export const lossApi: ILossApi = {
  getList: async (pagination: PaginationParams, filters?: LossFilterParams) => {
    let data = [...lossRecords];
    data = filterByRole(data, currentUser);

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
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pagination.pageSize);

    return delay(
      wrapResponse({
        data: paginatedData,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
    );
  },

  getById: async (id: string) => {
    const loss = lossRecords.find((d) => d.id === id);
    if (!loss) {
      return delay(wrapResponse(null as any, 404, '损耗记录不存在'), 200);
    }
    return delay(wrapResponse(loss));
  },

  updateStatus: async (id: string, request: UpdateLossStatusRequest) => {
    const index = lossRecords.findIndex((d) => d.id === id);
    if (index === -1) {
      return delay(wrapResponse(null as any, 404, '损耗记录不存在'), 200);
    }

    const current = lossRecords[index];
    
    if (!canTransitionLoss(current.status, request.status, currentUser.role)) {
      return delay(
        wrapResponse(null as any, 403, `当前角色无权限将状态从 ${current.status} 变更为 ${request.status}`),
        200
      );
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const historyItem: AnalysisHistoryItem = {
      id: generateId(),
      analysisId: current.analysis?.id || generateId(),
      timestamp: now,
      operator: currentUser.name,
      action: `状态变更: ${current.status} → ${request.status}`,
      content: `状态更新为${request.status}`,
    };

    const existingAnalysis = current.analysis || {
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

    const updated: LossRecord = {
      ...current,
      status: request.status,
      analysis: {
        ...existingAnalysis,
        rootCause: request.rootCause || existingAnalysis.rootCause,
        preventiveMeasure: request.preventiveMeasure || existingAnalysis.preventiveMeasure,
        responsibleParty: request.responsibleParty || existingAnalysis.responsibleParty,
        conclusion: request.conclusion || existingAnalysis.conclusion,
        analyst: currentUser.name,
        analyzedAt: now,
        history: [...existingAnalysis.history, historyItem],
      },
    };

    if (request.relatedDifferenceId) {
      const diff = inventoryDifferences.find((d) => d.id === request.relatedDifferenceId);
      if (diff) {
        const validation = validateDifferenceLossLink(diff, updated);
        if (!validation.valid) {
          return delay(wrapResponse(null as any, 400, validation.reason!), 200);
        }
        (updated as any).relatedDifferenceIds = [
          ...((current as any).relatedDifferenceIds || []),
          request.relatedDifferenceId,
        ];
      }
    }

    lossRecords[index] = updated;
    return delay(wrapResponse(updated));
  },

  linkDifference: async (lossId: string, differenceId: string) => {
    const lossIndex = lossRecords.findIndex((l) => l.id === lossId);
    const diff = inventoryDifferences.find((d) => d.id === differenceId);
    
    if (lossIndex === -1 || !diff) {
      return delay(wrapResponse(null as any, 404, '记录不存在'), 200);
    }

    const loss = lossRecords[lossIndex];
    const validation = validateDifferenceLossLink(diff, loss);
    if (!validation.valid) {
      return delay(wrapResponse(null as any, 400, validation.reason!), 200);
    }

    const updated = {
      ...loss,
      relatedDifferenceIds: [...((loss as any).relatedDifferenceIds || []), differenceId],
    };
    lossRecords[lossIndex] = updated;

    return delay(wrapResponse(updated));
  },
};

export const alertApi: IAlertApi = {
  getList: async (pagination: PaginationParams, filters?: AlertFilterParams) => {
    let data = [...alerts];
    data = filterByRole(data, currentUser);

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
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const statusOrder: Record<string, number> = { active: 0, processing: 1, resolved: 2, ignored: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const total = data.length;
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pagination.pageSize);

    return delay(
      wrapResponse({
        data: paginatedData,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
    );
  },

  getActive: async () => {
    let data = alerts.filter((a) => a.status === 'active' || a.status === 'processing');
    data = filterByRole(data, currentUser);
    return delay(wrapResponse(data));
  },

  updateStatus: async (id: string, request: UpdateAlertStatusRequest) => {
    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) {
      return delay(wrapResponse(null as any, 404, '预警不存在'), 200);
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const updated: Alert = {
      ...alerts[index],
      status: request.status,
      assignee: currentUser.name,
      handledAt: request.status === 'resolved' || request.status === 'ignored' ? now : alerts[index].handledAt,
      resolution: request.resolution || alerts[index].resolution,
    };

    alerts[index] = updated;
    return delay(wrapResponse(updated));
  },
};

export const dashboardApi: IDashboardApi = {
  getStats: async () => {
    let filteredDifferences = filterByRole(inventoryDifferences, currentUser);
    let filteredLosses = filterByRole(lossRecords, currentUser);
    let filteredAlerts = filterByRole(alerts, currentUser);

    return delay(
      wrapResponse({
        totalDifferences: filteredDifferences.length,
        pendingDifferences: filteredDifferences.filter((d) => d.status === 'pending').length,
        totalLoss: filteredLosses.reduce((sum, l) => sum + l.lossAmount, 0),
        activeAlerts: filteredAlerts.filter((a) => a.status === 'active').length,
        criticalAlerts: filteredAlerts.filter(
          (a) => a.severity === 'critical' && a.status === 'active'
        ).length,
      })
    );
  },

  getLossTrend: async () => {
    let filteredLosses = filterByRole(lossRecords, currentUser);

    const last7Days = Array.from({ length: 7 }, (_, i) =>
      dayjs().subtract(6 - i, 'day').format('MM-DD')
    );

    const data = last7Days.map((date) => {
      const dayLosses = filteredLosses.filter((l) =>
        dayjs(l.reportedAt).format('MM-DD') === date
      );
      return {
        date,
        amount: dayLosses.reduce((sum, l) => sum + l.lossAmount, 0),
        count: dayLosses.length,
      };
    });

    return delay(wrapResponse(data));
  },

  getLossTypeDistribution: async () => {
    let filteredLosses = filterByRole(lossRecords, currentUser);

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

    const data = Object.entries(distribution).map(([type, value]) => ({
      type,
      value,
      name: type,
    }));

    return delay(wrapResponse(data));
  },

  getDifferenceTypeDistribution: async () => {
    let filteredDifferences = filterByRole(inventoryDifferences, currentUser);

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

    const data = Object.entries(distribution).map(([type, value]) => ({
      type,
      value,
      name: type,
    }));

    return delay(wrapResponse(data));
  },
};
