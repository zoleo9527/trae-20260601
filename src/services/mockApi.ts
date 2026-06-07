import dayjs from 'dayjs';
import {
  User,
  PaginationParams,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  DifferenceType,
  LossType,
} from '@/types';
import { mockUsers } from '@/data/mockData';
import {
  differenceRepository,
  lossRepository,
  alertRepository,
} from '@/repository';
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

const getDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    resolved: '已解决',
    appealed: '申诉中',
    closed: '已关闭',
    recorded: '已登记',
    analyzing: '分析中',
    concluded: '已结案',
    archived: '已归档',
    active: '活跃',
    processing: '处理中',
    ignored: '已忽略',
  };
  return statusMap[status] || status;
};

export const differenceApi: IDifferenceApi = {
  getList: async (pagination: PaginationParams, filters?: DifferenceFilterParams) => {
    const allData = await differenceRepository.findAll();
    let data = filterByRole(allData, currentUser);

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
            d.storeName.toLowerCase().includes(keyword) ||
            d.sku.toLowerCase().includes(keyword)
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
    const difference = await differenceRepository.findById(id);
    if (!difference) {
      return delay(wrapResponse(null as any, 404, '盘点差异不存在'), 200);
    }
    return delay(wrapResponse(difference));
  },

  updateStatus: async (id: string, request: UpdateDifferenceStatusRequest) => {
    const current = await differenceRepository.findById(id);
    if (!current) {
      return delay(wrapResponse(null as any, 404, '盘点差异不存在'), 200);
    }

    if (!canTransitionDifference(current.status, request.status, currentUser.role)) {
      return delay(
        wrapResponse(
          null as any,
          403,
          `操作失败：${currentUser.role === 'store_manager' ? '店长' : currentUser.role === 'supervisor' ? '督导' : '商品专员'}无权将状态从「${getDisplayName(current.status)}」变更为「${getDisplayName(request.status)}」`
        ),
        200
      );
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (request.relatedLossId) {
      const loss = await lossRepository.findById(request.relatedLossId);
      if (!loss) {
        return delay(wrapResponse(null as any, 404, '关联的损耗记录不存在'), 200);
      }
      const validation = validateDifferenceLossLink(current, loss);
      if (!validation.valid) {
        return delay(wrapResponse(null as any, 400, validation.reason!), 200);
      }
      await differenceRepository.linkLossRecord(id, request.relatedLossId);
      await lossRepository.linkDifference(request.relatedLossId, id);
    }

    await differenceRepository.addHistory(
      id,
      currentUser.name,
      `状态变更: ${current.status} → ${request.status}`,
      request.remark || `状态更新为「${getDisplayName(request.status)}」`
    );

    const updated = await differenceRepository.update(id, {
      status: request.status,
      handler: currentUser.name,
      handledAt: now,
      resolution: request.remark || current.resolution,
    });

    return delay(wrapResponse(updated!));
  },

  linkLossRecord: async (differenceId: string, lossId: string) => {
    const difference = await differenceRepository.findById(differenceId);
    const loss = await lossRepository.findById(lossId);

    if (!difference || !loss) {
      return delay(wrapResponse(null as any, 404, '记录不存在'), 200);
    }

    const validation = validateDifferenceLossLink(difference, loss);
    if (!validation.valid) {
      return delay(wrapResponse(null as any, 400, validation.reason!), 200);
    }

    await differenceRepository.linkLossRecord(differenceId, lossId);
    await lossRepository.linkDifference(lossId, differenceId);

    const updated = await differenceRepository.findById(differenceId);
    return delay(wrapResponse(updated!));
  },
};

export const lossApi: ILossApi = {
  getList: async (pagination: PaginationParams, filters?: LossFilterParams) => {
    const allData = await lossRepository.findAll();
    let data = filterByRole(allData, currentUser);

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
            d.storeName.toLowerCase().includes(keyword) ||
            d.sku.toLowerCase().includes(keyword) ||
            d.description.toLowerCase().includes(keyword)
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
    const loss = await lossRepository.findById(id);
    if (!loss) {
      return delay(wrapResponse(null as any, 404, '损耗记录不存在'), 200);
    }
    return delay(wrapResponse(loss));
  },

  updateStatus: async (id: string, request: UpdateLossStatusRequest) => {
    const current = await lossRepository.findById(id);
    if (!current) {
      return delay(wrapResponse(null as any, 404, '损耗记录不存在'), 200);
    }

    if (!canTransitionLoss(current.status, request.status, currentUser.role)) {
      return delay(
        wrapResponse(
          null as any,
          403,
          `操作失败：${currentUser.role === 'store_manager' ? '店长' : currentUser.role === 'supervisor' ? '督导' : '商品专员'}无权将状态从「${getDisplayName(current.status)}」变更为「${getDisplayName(request.status)}」`
        ),
        200
      );
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (request.relatedDifferenceId) {
      const diff = await differenceRepository.findById(request.relatedDifferenceId);
      if (!diff) {
        return delay(wrapResponse(null as any, 404, '关联的盘点差异不存在'), 200);
      }
      const validation = validateDifferenceLossLink(diff, current);
      if (!validation.valid) {
        return delay(wrapResponse(null as any, 400, validation.reason!), 200);
      }
      await lossRepository.linkDifference(id, request.relatedDifferenceId);
      await differenceRepository.linkLossRecord(request.relatedDifferenceId, id);
    }

    await lossRepository.addAnalysisHistory(
      id,
      currentUser.name,
      `状态变更: ${current.status} → ${request.status}`,
      `状态更新为「${getDisplayName(request.status)}」`
    );

    await lossRepository.updateAnalysis(id, {
      rootCause: request.rootCause,
      preventiveMeasure: request.preventiveMeasure,
      responsibleParty: request.responsibleParty,
      conclusion: request.conclusion,
      analyst: currentUser.name,
      analyzedAt: now,
    });

    const updated = await lossRepository.update(id, {
      status: request.status,
    });

    return delay(wrapResponse(updated!));
  },

  linkDifference: async (lossId: string, differenceId: string) => {
    const loss = await lossRepository.findById(lossId);
    const difference = await differenceRepository.findById(differenceId);

    if (!loss || !difference) {
      return delay(wrapResponse(null as any, 404, '记录不存在'), 200);
    }

    const validation = validateDifferenceLossLink(difference, loss);
    if (!validation.valid) {
      return delay(wrapResponse(null as any, 400, validation.reason!), 200);
    }

    await lossRepository.linkDifference(lossId, differenceId);
    await differenceRepository.linkLossRecord(differenceId, lossId);

    const updated = await lossRepository.findById(lossId);
    return delay(wrapResponse(updated!));
  },
};

export const alertApi: IAlertApi = {
  getList: async (pagination: PaginationParams, filters?: AlertFilterParams) => {
    const allData = await alertRepository.findAll();
    let data = filterByRole(allData, currentUser);

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
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        data = data.filter(
          (d) =>
            d.title.toLowerCase().includes(keyword) ||
            d.description.toLowerCase().includes(keyword) ||
            d.alertNo.toLowerCase().includes(keyword) ||
            d.storeName.toLowerCase().includes(keyword) ||
            (d.productName && d.productName.toLowerCase().includes(keyword)) ||
            (d.sku && d.sku.toLowerCase().includes(keyword))
        );
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
    const allData = await alertRepository.findActive();
    const data = filterByRole(allData, currentUser);
    return delay(wrapResponse(data));
  },

  updateStatus: async (id: string, request: UpdateAlertStatusRequest) => {
    const current = await alertRepository.findById(id);
    if (!current) {
      return delay(wrapResponse(null as any, 404, '预警不存在'), 200);
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const updated = await alertRepository.update(id, {
      status: request.status,
      assignee: currentUser.name,
      handledAt: request.status === 'resolved' || request.status === 'ignored' ? now : current.handledAt,
      resolution: request.resolution || current.resolution,
    });

    return delay(wrapResponse(updated!));
  },
};

export const dashboardApi: IDashboardApi = {
  getStats: async () => {
    const allDifferences = await differenceRepository.findAll();
    const allLosses = await lossRepository.findAll();
    const allAlerts = await alertRepository.findAll();

    const filteredDifferences = filterByRole(allDifferences, currentUser);
    const filteredLosses = filterByRole(allLosses, currentUser);
    const filteredAlerts = filterByRole(allAlerts, currentUser);

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
    const allLosses = await lossRepository.findAll();
    const filteredLosses = filterByRole(allLosses, currentUser);

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
    const allLosses = await lossRepository.findAll();
    const filteredLosses = filterByRole(allLosses, currentUser);

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
    const allDifferences = await differenceRepository.findAll();
    const filteredDifferences = filterByRole(allDifferences, currentUser);

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
