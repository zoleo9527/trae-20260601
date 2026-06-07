import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { readJSON, writeJSON } from './storage';
import {
  InventoryDifference,
  LossRecord,
  Alert,
  PaginationParams,
  PaginatedResponse,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  ApiResponse,
  UserRole,
  DifferenceHistoryItem,
  AnalysisHistoryItem,
} from './types';
import { initialDifferences, initialLossRecords, initialAlerts } from './initData';
import {
  canTransitionDifference,
  canTransitionLoss,
  validateDifferenceLossLink,
  getStatusDisplayName,
  getRoleDisplayName,
} from './stateConstraints';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

const DIFFERENCES_FILE = 'differences.json';
const LOSSES_FILE = 'losses.json';
const ALERTS_FILE = 'alerts.json';

const generateId = () => Math.random().toString(36).substring(2, 10);

const loadDifferences = (): InventoryDifference[] =>
  readJSON<InventoryDifference[]>(DIFFERENCES_FILE, initialDifferences);
const saveDifferences = (data: InventoryDifference[]) =>
  writeJSON(DIFFERENCES_FILE, data);

const loadLosses = (): LossRecord[] =>
  readJSON<LossRecord[]>(LOSSES_FILE, initialLossRecords);
const saveLosses = (data: LossRecord[]) => writeJSON(LOSSES_FILE, data);

const loadAlerts = (): Alert[] => readJSON<Alert[]>(ALERTS_FILE, initialAlerts);
const saveAlerts = (data: Alert[]) => writeJSON(ALERTS_FILE, data);

const getRoleFromHeader = (req: express.Request): UserRole => {
  return (req.headers['x-user-role'] as UserRole) || 'store_manager';
};

const getUserNameFromHeader = (req: express.Request): string => {
  const role = getRoleFromHeader(req);
  const nameMap: Record<UserRole, string> = {
    store_manager: '张店长',
    supervisor: '李督导',
    product_specialist: '王专员',
  };
  return nameMap[role] || '未知用户';
};

const filterByRole = <T extends { storeId: string }>(
  data: T[],
  role: UserRole
): T[] => {
  if (role === 'store_manager') {
    return data.filter((d) => d.storeId === 'S001');
  }
  if (role === 'supervisor') {
    return data.filter((d) => ['S001', 'S002'].includes(d.storeId));
  }
  return data;
};

const wrapResponse = <T>(data: T, code = 0, message = 'success'): ApiResponse<T> => ({
  code,
  message,
  data,
});

const paginate = <T>(
  data: T[],
  pagination: PaginationParams
): PaginatedResponse<T> => {
  const total = data.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pagination.pageSize);
  return {
    data: paginatedData,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
};

app.get('/api/differences', (req, res) => {
  const role = getRoleFromHeader(req);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const filters: DifferenceFilterParams = {
    storeId: req.query.storeId as string,
    status: req.query.status as any,
    differenceType: req.query.differenceType as any,
    keyword: req.query.keyword as string,
    dateRange: req.query.dateRange
      ? (req.query.dateRange as string).split(',') as [string, string]
      : undefined,
  };

  let data = loadDifferences();
  data = filterByRole(data, role);

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

  const result = paginate(data, { page, pageSize });
  res.json(wrapResponse(result));
});

app.get('/api/differences/:id', (req, res) => {
  const data = loadDifferences();
  const item = data.find((d) => d.id === req.params.id);
  if (!item) {
    res.status(404).json(wrapResponse(null, 404, '盘点差异不存在'));
    return;
  }
  res.json(wrapResponse(item));
});

app.put('/api/differences/:id/status', (req, res) => {
  const role = getRoleFromHeader(req);
  const userName = getUserNameFromHeader(req);
  const { status, remark, relatedLossId } = req.body;

  const data = loadDifferences();
  const index = data.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json(wrapResponse(null, 404, '盘点差异不存在'));
    return;
  }

  const current = data[index];
  if (!canTransitionDifference(current.status, status, role)) {
    res
      .status(403)
      .json(
        wrapResponse(
          null,
          403,
          `操作失败：${getRoleDisplayName(role)}无权将状态从「${getStatusDisplayName(
            current.status
          )}」变更为「${getStatusDisplayName(status)}」`
        )
      );
    return;
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const historyItem: DifferenceHistoryItem = {
    id: generateId(),
    differenceId: current.id,
    timestamp: now,
    operator: userName,
    action: `状态变更: ${current.status} → ${status}`,
    content: remark || `状态更新为「${getStatusDisplayName(status)}」`,
  };

  if (relatedLossId) {
    const losses = loadLosses();
    const loss = losses.find((l) => l.id === relatedLossId);
    if (!loss) {
      res.status(404).json(wrapResponse(null, 404, '关联的损耗记录不存在'));
      return;
    }
    const validation = validateDifferenceLossLink(current, loss);
    if (!validation.valid) {
      res.status(400).json(wrapResponse(null, 400, validation.reason!));
      return;
    }

    const lossIndex = losses.findIndex((l) => l.id === relatedLossId);
    const relatedDiffIds = losses[lossIndex].relatedDifferenceIds || [];
    if (!relatedDiffIds.includes(current.id)) {
      losses[lossIndex] = {
        ...losses[lossIndex],
        relatedDifferenceIds: [...relatedDiffIds, current.id],
      };
      saveLosses(losses);
    }

    const relatedLossIds = current.relatedLossIds || [];
    if (!relatedLossIds.includes(relatedLossId)) {
      (data[index] as any).relatedLossIds = [...relatedLossIds, relatedLossId];
    }
  }

  data[index] = {
    ...data[index],
    status,
    handler: userName,
    handledAt: now,
    resolution: remark || current.resolution,
    history: [...current.history, historyItem],
    relatedLossIds: (data[index] as any).relatedLossIds || current.relatedLossIds,
  };

  saveDifferences(data);
  res.json(wrapResponse(data[index]));
});

app.get('/api/losses', (req, res) => {
  const role = getRoleFromHeader(req);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const filters: LossFilterParams = {
    storeId: req.query.storeId as string,
    status: req.query.status as any,
    lossType: req.query.lossType as any,
    keyword: req.query.keyword as string,
    dateRange: req.query.dateRange
      ? (req.query.dateRange as string).split(',') as [string, string]
      : undefined,
  };

  let data = loadLosses();
  data = filterByRole(data, role);

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

  const result = paginate(data, { page, pageSize });
  res.json(wrapResponse(result));
});

app.get('/api/losses/:id', (req, res) => {
  const data = loadLosses();
  const item = data.find((d) => d.id === req.params.id);
  if (!item) {
    res.status(404).json(wrapResponse(null, 404, '损耗记录不存在'));
    return;
  }
  res.json(wrapResponse(item));
});

app.put('/api/losses/:id/status', (req, res) => {
  const role = getRoleFromHeader(req);
  const userName = getUserNameFromHeader(req);
  const { status, rootCause, preventiveMeasure, responsibleParty, conclusion, relatedDifferenceId } =
    req.body;

  const data = loadLosses();
  const index = data.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json(wrapResponse(null, 404, '损耗记录不存在'));
    return;
  }

  const current = data[index];
  if (!canTransitionLoss(current.status, status, role)) {
    res
      .status(403)
      .json(
        wrapResponse(
          null,
          403,
          `操作失败：${getRoleDisplayName(role)}无权将状态从「${getStatusDisplayName(
            current.status
          )}」变更为「${getStatusDisplayName(status)}」`
        )
      );
    return;
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  if (relatedDifferenceId) {
    const diffs = loadDifferences();
    const diff = diffs.find((d) => d.id === relatedDifferenceId);
    if (!diff) {
      res.status(404).json(wrapResponse(null, 404, '关联的盘点差异不存在'));
      return;
    }
    const validation = validateDifferenceLossLink(diff, current);
    if (!validation.valid) {
      res.status(400).json(wrapResponse(null, 400, validation.reason!));
      return;
    }

    const diffIndex = diffs.findIndex((d) => d.id === relatedDifferenceId);
    const relatedLossIds = diffs[diffIndex].relatedLossIds || [];
    if (!relatedLossIds.includes(current.id)) {
      diffs[diffIndex] = {
        ...diffs[diffIndex],
        relatedLossIds: [...relatedLossIds, current.id],
      };
      saveDifferences(diffs);
    }

    const relatedDiffIds = current.relatedDifferenceIds || [];
    if (!relatedDiffIds.includes(relatedDifferenceId)) {
      (data[index] as any).relatedDifferenceIds = [...relatedDiffIds, relatedDifferenceId];
    }
  }

  const existingAnalysis = current.analysis || {
    id: generateId(),
    lossId: current.id,
    analyst: userName,
    analyzedAt: now,
    rootCause: '',
    preventiveMeasure: '',
    responsibleParty: '',
    conclusion: '',
    history: [],
  };

  const historyItem: AnalysisHistoryItem = {
    id: generateId(),
    analysisId: existingAnalysis.id,
    timestamp: now,
    operator: userName,
    action: `状态变更: ${current.status} → ${status}`,
    content: `状态更新为「${getStatusDisplayName(status)}」`,
  };

  data[index] = {
    ...data[index],
    status,
    analysis: {
      ...existingAnalysis,
      rootCause: rootCause || existingAnalysis.rootCause,
      preventiveMeasure: preventiveMeasure || existingAnalysis.preventiveMeasure,
      responsibleParty: responsibleParty || existingAnalysis.responsibleParty,
      conclusion: conclusion || existingAnalysis.conclusion,
      analyst: userName,
      analyzedAt: now,
      history: [...existingAnalysis.history, historyItem],
    },
    relatedDifferenceIds: (data[index] as any).relatedDifferenceIds || current.relatedDifferenceIds,
  };

  saveLosses(data);
  res.json(wrapResponse(data[index]));
});

app.get('/api/alerts', (req, res) => {
  const role = getRoleFromHeader(req);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const filters: AlertFilterParams = {
    storeId: req.query.storeId as string,
    status: req.query.status as any,
    alertType: req.query.alertType as any,
    severity: req.query.severity as any,
    keyword: req.query.keyword as string,
    dateRange: req.query.dateRange
      ? (req.query.dateRange as string).split(',') as [string, string]
      : undefined,
  };

  let data = loadAlerts();
  data = filterByRole(data, role);

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

  data.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { active: 0, processing: 1, resolved: 2, ignored: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const result = paginate(data, { page, pageSize });
  res.json(wrapResponse(result));
});

app.get('/api/alerts/active', (req, res) => {
  const role = getRoleFromHeader(req);
  let data = loadAlerts();
  data = filterByRole(data, role);
  data = data.filter((a) => a.status === 'active' || a.status === 'processing');
  res.json(wrapResponse(data));
});

app.put('/api/alerts/:id/status', (req, res) => {
  const userName = getUserNameFromHeader(req);
  const { status, resolution } = req.body;

  const data = loadAlerts();
  const index = data.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json(wrapResponse(null, 404, '预警不存在'));
    return;
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  data[index] = {
    ...data[index],
    status,
    assignee: userName,
    handledAt: status === 'resolved' || status === 'ignored' ? now : data[index].handledAt,
    resolution: resolution || data[index].resolution,
  };

  saveAlerts(data);
  res.json(wrapResponse(data[index]));
});

app.get('/api/dashboard/stats', (req, res) => {
  const role = getRoleFromHeader(req);
  const diffs = filterByRole(loadDifferences(), role);
  const losses = filterByRole(loadLosses(), role);
  const alerts = filterByRole(loadAlerts(), role);

  res.json(
    wrapResponse({
      totalDifferences: diffs.length,
      pendingDifferences: diffs.filter((d) => d.status === 'pending').length,
      totalLoss: losses.reduce((sum, l) => sum + l.lossAmount, 0),
      activeAlerts: alerts.filter((a) => a.status === 'active').length,
      criticalAlerts: alerts.filter(
        (a) => a.severity === 'critical' && a.status === 'active'
      ).length,
    })
  );
});

app.get('/api/dashboard/loss-trend', (req, res) => {
  const role = getRoleFromHeader(req);
  const losses = filterByRole(loadLosses(), role);

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day').format('MM-DD')
  );

  const data = last7Days.map((date) => {
    const dayLosses = losses.filter((l) => dayjs(l.reportedAt).format('MM-DD') === date);
    return {
      date,
      amount: dayLosses.reduce((sum, l) => sum + l.lossAmount, 0),
      count: dayLosses.length,
    };
  });

  res.json(wrapResponse(data));
});

app.get('/api/dashboard/loss-type-distribution', (req, res) => {
  const role = getRoleFromHeader(req);
  const losses = filterByRole(loadLosses(), role);

  const typeMap: Record<string, string> = {
    expired: '过期损耗',
    damaged: '破损损耗',
    stolen: '偷盗损耗',
    other: '其他损耗',
  };

  const distribution: Record<string, number> = {};
  losses.forEach((l) => {
    const key = typeMap[l.lossType] || l.lossType;
    distribution[key] = (distribution[key] || 0) + l.lossAmount;
  });

  const data = Object.entries(distribution).map(([type, value]) => ({
    type,
    value,
    name: type,
  }));

  res.json(wrapResponse(data));
});

app.get('/api/dashboard/difference-type-distribution', (req, res) => {
  const role = getRoleFromHeader(req);
  const diffs = filterByRole(loadDifferences(), role);

  const typeMap: Record<string, string> = {
    overage: '溢余',
    shortage: '短缺',
    price_mismatch: '价签错误',
  };

  const distribution: Record<string, number> = {};
  diffs.forEach((d) => {
    const key = typeMap[d.differenceType] || d.differenceType;
    distribution[key] = (distribution[key] || 0) + d.differenceAmount;
  });

  const data = Object.entries(distribution).map(([type, value]) => ({
    type,
    value,
    name: type,
  }));

  res.json(wrapResponse(data));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
