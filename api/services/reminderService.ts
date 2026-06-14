import type {
  Reminder,
  ReminderStatus,
  HistoryRecord,
  User,
  ScheduleReminderRequest,
  ExecuteReminderRequest,
  ConfirmFeeRequest,
  ReviewRequest,
  DisputeRequest,
} from '../../shared/types';
import { reminderStore, mockUsers, findByRole } from '../data/mockData.js';

function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

function addHistory(
  reminder: Reminder,
  status: ReminderStatus,
  operatorId: string,
  action: string,
  remark: string
): void {
  const operator = getUserById(operatorId);
  if (!operator) return;
  const record: HistoryRecord = {
    id: generateId(),
    reminderId: reminder.id,
    status,
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action,
    remark,
    createdAt: new Date().toISOString(),
  };
  reminder.history.push(record);
}

function setOwner(reminder: Reminder, ownerId: string): void {
  const owner = getUserById(ownerId);
  if (!owner) return;
  reminder.currentOwnerId = ownerId;
  reminder.currentOwnerName = owner.name;
  reminder.currentOwnerRole = owner.role;
}

export function getAllReminders(status?: string, keyword?: string): Reminder[] {
  let list = Array.from(reminderStore.values());
  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter(
      (r) =>
        r.student.name.toLowerCase().includes(kw) ||
        r.reason.toLowerCase().includes(kw) ||
        r.subject.toLowerCase().includes(kw)
    );
  }
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getReminderById(id: string): Reminder | undefined {
  return reminderStore.get(id);
}

export function scheduleReminder(
  id: string,
  payload: ScheduleReminderRequest,
  operatorId: string
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  if (r.status !== 'pending_schedule' && r.status !== 'disputed') {
    return null;
  }
  r.scheduledAt = payload.scheduledAt;
  r.assignedCoachId = payload.assignedCoachId;
  const coach = getUserById(payload.assignedCoachId);
  if (coach) {
    r.assignedCoachName = coach.name;
  }
  r.status = 'pending_execute';
  setOwner(r, payload.assignedCoachId);
  addHistory(r, 'pending_execute', operatorId, '安排补训', payload.remark || `安排${r.assignedCoachName}教练带训`);
  return r;
}

export function executeReminder(
  id: string,
  payload: ExecuteReminderRequest,
  operatorId: string
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  if (r.status !== 'pending_execute') return null;
  r.executedAt = payload.executedAt;
  r.executedRemark = payload.executedRemark;
  r.status = 'pending_confirm';
  const enrollers = findByRole('enroller');
  if (enrollers.length > 0) {
    setOwner(r, enrollers[0].id);
  }
  addHistory(r, 'pending_confirm', operatorId, '执行补训完成', payload.executedRemark || '补训已执行完毕');
  return r;
}

export function confirmFee(
  id: string,
  payload: ConfirmFeeRequest,
  operatorId: string
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  if (r.status !== 'pending_confirm' && r.status !== 'disputed') return null;
  r.fee.paymentStatus = payload.paymentStatus;
  r.fee.confirmedBy = payload.confirmedBy;
  r.fee.confirmedAt = new Date().toISOString();
  r.status = 'completed';
  setOwner(r, operatorId);
  addHistory(r, 'completed', operatorId, '费用确认完成', payload.remark || `费用已${payload.paymentStatus === 'paid' ? '缴纳' : '确认'}`);
  return r;
}

export function reviewReminder(
  id: string,
  payload: ReviewRequest,
  operatorId: string
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  addHistory(r, r.status, operatorId, payload.approve ? '安全员审核通过' : '安全员审核驳回', payload.remark);
  return r;
}

export function markDispute(
  id: string,
  payload: DisputeRequest
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  r.status = 'disputed';
  const safetyOfficers = findByRole('safety_officer');
  if (safetyOfficers.length > 0) {
    setOwner(r, safetyOfficers[0].id);
  }
  addHistory(r, 'disputed', payload.operatorId, '标记争议', payload.remark || '流程存在争议，需安全员介入');
  return r;
}

export function resolveDispute(
  id: string,
  payload: { remark: string; resolveTo: ReminderStatus },
  operatorId: string
): Reminder | null {
  const r = reminderStore.get(id);
  if (!r) return null;
  if (r.status !== 'disputed') return null;
  r.status = payload.resolveTo;
  if (payload.resolveTo === 'pending_schedule') {
    const enrollers = findByRole('enroller');
    if (enrollers.length > 0) {
      setOwner(r, enrollers[0].id);
    }
  } else if (payload.resolveTo === 'pending_execute') {
    if (r.assignedCoachId) {
      setOwner(r, r.assignedCoachId);
    }
  } else if (payload.resolveTo === 'pending_confirm') {
    const enrollers = findByRole('enroller');
    if (enrollers.length > 0) {
      setOwner(r, enrollers[0].id);
    }
  } else if (payload.resolveTo === 'completed') {
    setOwner(r, operatorId);
  }
  addHistory(r, payload.resolveTo, operatorId, '争议处理完成', payload.remark || '争议已处理，恢复正常流程');
  return r;
}

export function getAllUsers(role?: string): User[] {
  if (role) {
    return mockUsers.filter((u) => u.role === role);
  }
  return mockUsers;
}
