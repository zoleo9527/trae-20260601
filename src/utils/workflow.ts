import type { ClaimStatus, ActionType, Role, Claim, WorkflowLog, Handler } from '@/types';

export const TRANSITION_RULES: Record<ClaimStatus, ClaimStatus[]> = {
  pending: ['approved', 'returned', 'supplement', 'urged'],
  urged: ['approved', 'returned', 'supplement'],
  returned: ['pending', 'urged'],
  supplement: ['pending', 'urged'],
  approved: ['calculating', 'completed', 'urged'],
  calculating: ['completed', 'urged'],
  completed: [],
};

export const PERMISSION_MATRIX: Record<ActionType, Role[]> = {
  create: ['specialist', 'supervisor'],
  approve: ['supervisor'],
  reject: ['supervisor'],
  supplement: ['supervisor', 'specialist'],
  material_ok: ['specialist', 'surveyor'],
  start_calc: ['specialist'],
  update_calc: ['specialist'],
  finish_calc: ['specialist'],
  urge: ['supervisor', 'specialist'],
};

export const ACTION_TO_STATUS: Record<ActionType, ClaimStatus | null> = {
  create: 'pending',
  approve: 'approved',
  reject: 'returned',
  supplement: 'supplement',
  material_ok: 'pending',
  start_calc: 'calculating',
  update_calc: null,
  finish_calc: 'completed',
  urge: 'urged',
};

export const SAME_STATE_ACTIONS: ActionType[] = ['update_calc'];

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return TRANSITION_RULES[from]?.includes(to) ?? false;
}

export function canPerformAction(action: ActionType, role: Role): boolean {
  return PERMISSION_MATRIX[action]?.includes(role) ?? false;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function calculateDurationHours(start: string | Date, end: string | Date): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

export function calculateStuckPoint(
  claim: Claim,
  handlers: Handler[]
): { handler: Handler | null; duration: number; reason: string } {
  if (claim.workflowLogs.length === 0) {
    return {
      handler: handlers.find(h => h.id === claim.currentHandlerId) || null,
      duration: calculateDurationHours(claim.createdAt, new Date()),
      reason: '案件刚创建，等待处理',
    };
  }

  const lastLog = claim.workflowLogs[claim.workflowLogs.length - 1];
  const currentHandler = handlers.find(h => h.id === claim.currentHandlerId) || null;
  const duration = calculateDurationHours(lastLog.createdAt, new Date());

  let reason = '';
  if (claim.status === 'urged') {
    reason = `已被催办 ${claim.urgeCount} 次，当前卡点：${claim.stuckReason || '待处理人响应'}`;
  } else if (claim.status === 'returned') {
    const rejectLog = [...claim.workflowLogs].reverse().find(l => l.actionType === 'reject');
    reason = rejectLog?.reason || '案件被退回，等待修改';
  } else if (claim.status === 'supplement') {
    const pendingMaterials = claim.supplementMaterials.filter(m => m.status === 'pending');
    reason = `待补充材料：${pendingMaterials.map(m => m.name).join('、')}`;
  } else if (claim.status === 'calculating') {
    reason = '赔付计算进行中';
  } else if (claim.status === 'pending') {
    reason = claim.stuckReason || '等待核赔审批';
  } else if (claim.status === 'approved') {
    reason = '审批通过，等待进入赔付计算';
  } else {
    reason = '处理完成';
  }

  return { handler: currentHandler, duration, reason };
}

export function calculateDurations(logs: WorkflowLog[]): Record<string, number> {
  const durations: Record<string, number> = {};
  for (const log of logs) {
    const key = `${log.actionType}-${log.handlerId}`;
    durations[key] = (durations[key] || 0) + log.durationHours;
  }
  return durations;
}

export function getHandlerName(handlerId: string, handlers: Handler[]): string {
  const handler = handlers.find(h => h.id === handlerId);
  return handler?.name || '未知处理人';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateCaseNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LP${year}${month}${day}${random}`;
}

export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
