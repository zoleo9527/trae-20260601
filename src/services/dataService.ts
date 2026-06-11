import type {
  Customer,
  VisitRecord,
  FollowUpRecord,
  Subscription,
  SubscriptionMaterial,
  SigningReminder,
  OperationLog,
  FilterOptions,
  Role,
  HandoverRecord,
  TodoItem,
  StatusTransition,
  DashboardAlert,
  RoleWorkload,
} from '@/types';
import {
  mockCustomers,
  mockVisitRecords,
  mockFollowUpRecords,
  mockSubscriptions,
  mockSubscriptionMaterials,
  mockSigningReminders,
  mockOperationLogs,
  mockHandoverRecords,
  mockTodoItems,
  mockStatusTransitions,
  roleLabels,
} from '@/data/mockData';

let customers = [...mockCustomers];
let visitRecords = [...mockVisitRecords];
let followUpRecords = [...mockFollowUpRecords];
let subscriptions = [...mockSubscriptions];
let subscriptionMaterials = [...mockSubscriptionMaterials];
let signingReminders = [...mockSigningReminders];
let operationLogs = [...mockOperationLogs];
let handoverRecords = [...mockHandoverRecords];
let todoItems = [...mockTodoItems];
let statusTransitions = [...mockStatusTransitions];

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

function addLog(log: Omit<OperationLog, 'id' | 'timestamp'>) {
  operationLogs.unshift({
    ...log,
    id: generateId('l'),
    timestamp: new Date().toISOString(),
  });
}

function getDaysLeft(deadline: string): number {
  const now = new Date().getTime();
  const dead = new Date(deadline).getTime();
  return Math.ceil((dead - now) / (24 * 60 * 60 * 1000));
}

export async function getCustomers(filter?: FilterOptions): Promise<Customer[]> {
  let result = [...customers];
  if (filter?.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter(
      (c) => c.name.toLowerCase().includes(kw) || c.phone.includes(kw)
    );
  }
  if (filter?.status && filter.status !== 'all') {
    result = result.filter((c) => c.status === filter.status);
  }
  if (filter?.consultantId) {
    result = result.filter((c) => c.consultantId === filter.consultantId);
  }
  return result;
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  return customers.find((c) => c.id === id);
}

export async function getVisitRecords(customerId?: string): Promise<VisitRecord[]> {
  if (customerId) {
    return visitRecords.filter((v) => v.customerId === customerId);
  }
  return visitRecords;
}

export async function addVisitRecord(
  record: Omit<VisitRecord, 'id' | 'createdAt'>,
  operator: { id: string; name: string; role: Role }
): Promise<VisitRecord> {
  const newRecord: VisitRecord = {
    ...record,
    id: generateId('v'),
    createdAt: new Date().toISOString(),
  };
  visitRecords.unshift(newRecord);
  addLog({
    type: 'visit',
    targetId: newRecord.id,
    targetType: '来访记录',
    action: '新增来访登记',
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: `客户 ${record.customerName} 来访登记`,
  });
  return newRecord;
}

export async function getFollowUpRecords(
  consultantId?: string
): Promise<FollowUpRecord[]> {
  if (consultantId) {
    return followUpRecords.filter((f) => f.consultantId === consultantId);
  }
  return followUpRecords;
}

export async function addFollowUpRecord(
  record: Omit<FollowUpRecord, 'id'>,
  operator: { id: string; name: string; role: Role }
): Promise<FollowUpRecord> {
  const newRecord: FollowUpRecord = {
    ...record,
    id: generateId('f'),
  };
  followUpRecords.unshift(newRecord);
  addLog({
    type: 'followup',
    targetId: newRecord.id,
    targetType: '跟进记录',
    action: '新增跟进',
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: `客户 ${record.customerName} 跟进记录：${record.content}`,
  });
  return newRecord;
}

export async function getSubscriptions(filter?: FilterOptions): Promise<Subscription[]> {
  let result = [...subscriptions];
  if (filter?.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter(
      (s) =>
        s.customerName.toLowerCase().includes(kw) ||
        s.subscriptionNo.toLowerCase().includes(kw) ||
        s.unitNo.includes(kw)
    );
  }
  if (filter?.status && filter.status !== 'all') {
    result = result.filter((s) => s.status === filter.status);
  }
  if (filter?.consultantId) {
    result = result.filter((s) => s.consultantId === filter.consultantId);
  }
  if (filter?.urgency && filter.urgency !== 'all') {
    result = result.filter((s) => s.urgency === filter.urgency);
  }
  return result.sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return new Date(a.signDeadline).getTime() - new Date(b.signDeadline).getTime();
  });
}

export async function getSubscriptionById(id: string): Promise<Subscription | undefined> {
  return subscriptions.find((s) => s.id === id);
}

export async function getSubscriptionMaterials(
  subscriptionId: string
): Promise<SubscriptionMaterial[]> {
  return subscriptionMaterials.filter((m) => m.subscriptionId === subscriptionId);
}

export async function updateSubscriptionMaterial(
  materialId: string,
  updates: Partial<SubscriptionMaterial>,
  operator: { id: string; name: string; role: Role }
): Promise<SubscriptionMaterial | undefined> {
  const idx = subscriptionMaterials.findIndex((m) => m.id === materialId);
  if (idx === -1) return undefined;

  subscriptionMaterials[idx] = { ...subscriptionMaterials[idx], ...updates };

  const subId = subscriptionMaterials[idx].subscriptionId;
  const subIdx = subscriptions.findIndex((s) => s.id === subId);
  if (subIdx !== -1) {
    const materials = subscriptionMaterials.filter((m) => m.subscriptionId === subId);
    const allVerified = materials.every((m) => m.status === 'verified');
    const anyReturned = materials.some((m) => m.status === 'returned');
    const anyPending = materials.some((m) => m.status === 'pending');

    let materialStatus: Subscription['materialStatus'] = 'submitted';
    if (allVerified) materialStatus = 'verified';
    else if (anyReturned) materialStatus = 'returned';
    else if (anyPending) materialStatus = 'incomplete';

    subscriptions[subIdx] = {
      ...subscriptions[subIdx],
      materialStatus,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: operator.name,
      lastModifiedAt: new Date().toISOString(),
    };

    updateReminderOnMaterialChange(subId, operator);
  }

  addLog({
    type: 'material',
    targetId: subId,
    targetType: '认购资料',
    action: '资料状态变更',
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: `资料 ${subscriptionMaterials[idx].name} 状态变更为：${updates.status}`,
  });

  return subscriptionMaterials[idx];
}

function updateReminderOnMaterialChange(
  subscriptionId: string,
  operator: { id: string; name: string; role: Role }
) {
  const reminderIdx = signingReminders.findIndex(
    (r) => r.subscriptionId === subscriptionId
  );
  if (reminderIdx === -1) return;

  const sub = subscriptions.find((s) => s.id === subscriptionId);
  if (!sub) return;

  const materials = subscriptionMaterials.filter((m) => m.subscriptionId === subscriptionId);
  const materialReady = materials.every((m) => m.status === 'verified');

  let urgency = signingReminders[reminderIdx].urgency;
  const daysLeft = getDaysLeft(sub.signDeadline);
  if (daysLeft <= 1) urgency = 'critical';
  else if (daysLeft <= 3) urgency = 'urgent';
  else urgency = 'normal';

  signingReminders[reminderIdx] = {
    ...signingReminders[reminderIdx],
    materialReady,
    materialModified: true,
    lastMaterialChangeAt: new Date().toISOString(),
    urgency,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>,
  operator: { id: string; name: string; role: Role }
): Promise<Subscription | undefined> {
  const idx = subscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;

  const oldSub = subscriptions[idx];
  subscriptions[idx] = {
    ...oldSub,
    ...updates,
    modifiedCount: oldSub.modifiedCount + 1,
    lastModifiedBy: operator.name,
    lastModifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const reminderIdx = signingReminders.findIndex((r) => r.subscriptionId === id);
  if (reminderIdx !== -1) {
    signingReminders[reminderIdx] = {
      ...signingReminders[reminderIdx],
      materialModified: true,
      lastMaterialChangeAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  addLog({
    type: 'subscription',
    targetId: id,
    targetType: '认购单',
    action: '修改认购单',
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: `认购单 ${oldSub.subscriptionNo} 被修改`,
  });

  return subscriptions[idx];
}

export async function getSigningReminders(filter?: FilterOptions): Promise<SigningReminder[]> {
  let result = [...signingReminders];
  if (filter?.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter(
      (r) =>
        r.customerName.toLowerCase().includes(kw) ||
        r.subscriptionNo.toLowerCase().includes(kw) ||
        r.unitNo.includes(kw)
    );
  }
  if (filter?.status && filter.status !== 'all') {
    result = result.filter((r) => r.status === filter.status);
  }
  if (filter?.urgency && filter.urgency !== 'all') {
    result = result.filter((r) => r.urgency === filter.urgency);
  }
  return result.sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return new Date(a.signDeadline).getTime() - new Date(b.signDeadline).getTime();
  });
}

export async function sendSigningReminder(
  reminderId: string,
  operator: { id: string; name: string; role: Role }
): Promise<SigningReminder | undefined> {
  const idx = signingReminders.findIndex((r) => r.id === reminderId);
  if (idx === -1) return undefined;

  signingReminders[idx] = {
    ...signingReminders[idx],
    status: 'reminded',
    reminderCount: signingReminders[idx].reminderCount + 1,
    lastReminderAt: new Date().toISOString(),
    lastReminderBy: operator.name,
    updatedAt: new Date().toISOString(),
  };

  addLog({
    type: 'reminder',
    targetId: reminderId,
    targetType: '签约提醒',
    action: '发送提醒',
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: `向 ${signingReminders[idx].customerName} 发送第 ${signingReminders[idx].reminderCount} 次签约提醒`,
  });

  return signingReminders[idx];
}

export async function updateReminderStatus(
  reminderId: string,
  status: SigningReminder['status'],
  reason?: string,
  operator?: { id: string; name: string; role: Role }
): Promise<SigningReminder | undefined> {
  const idx = signingReminders.findIndex((r) => r.id === reminderId);
  if (idx === -1) return undefined;

  const delayDays = status === 'delayed' ? Math.floor(Math.random() * 5) + 1 : undefined;

  signingReminders[idx] = {
    ...signingReminders[idx],
    status,
    delayReason: reason,
    delayDays,
    updatedAt: new Date().toISOString(),
  };

  if (operator) {
    addLog({
      type: 'reminder',
      targetId: reminderId,
      targetType: '签约提醒',
      action: '状态变更',
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      detail: `签约提醒状态变更为：${status}${reason ? `，原因：${reason}` : ''}`,
    });
  }

  return signingReminders[idx];
}

export async function getSigningReminderById(
  id: string
): Promise<SigningReminder | undefined> {
  return signingReminders.find((r) => r.id === id);
}

export async function getOperationLogs(
  targetId?: string,
  targetType?: string
): Promise<OperationLog[]> {
  let result = [...operationLogs];
  if (targetId) {
    result = result.filter((l) => l.targetId === targetId);
  }
  if (targetType) {
    result = result.filter((l) => l.targetType === targetType);
  }
  return result;
}

function addStatusTransition(
  targetId: string,
  targetType: string,
  fromStatus: string,
  toStatus: string,
  operator: { id: string; name: string; role: Role },
  reason?: string
) {
  statusTransitions.unshift({
    id: generateId('st'),
    targetId,
    targetType,
    fromStatus,
    toStatus,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    reason,
    timestamp: new Date().toISOString(),
  });
}

function createTodo(
  type: TodoItem['type'],
  title: string,
  description: string,
  priority: TodoItem['priority'],
  role: Role,
  assigneeId: string,
  assigneeName: string,
  targetId: string,
  targetType: string,
  dueAt?: string
): TodoItem {
  const todo: TodoItem = {
    id: generateId('t'),
    type,
    title,
    description,
    priority,
    role,
    assigneeId,
    assigneeName,
    targetId,
    targetType,
    status: 'pending',
    dueAt,
    createdAt: new Date().toISOString(),
  };
  todoItems.unshift(todo);
  return todo;
}

function createHandover(
  fromStage: HandoverRecord['fromStage'],
  toStage: HandoverRecord['toStage'],
  targetId: string,
  targetType: string,
  targetName: string,
  fromRole: Role,
  toRole: Role,
  fromPerson: string,
  toPerson: string,
  remark: string,
  deadline?: string
): HandoverRecord {
  const handover: HandoverRecord = {
    id: generateId('h'),
    fromStage,
    toStage,
    targetId,
    targetType,
    targetName,
    fromRole,
    toRole,
    fromPerson,
    toPerson,
    status: 'in_progress',
    remark,
    deadline,
    handedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  handoverRecords.unshift(handover);
  return handover;
}

export async function getHandoverRecords(
  role?: Role,
  userId?: string
): Promise<HandoverRecord[]> {
  let result = [...handoverRecords];
  if (role && userId) {
    result = result.filter(
      (h) =>
        (h.fromRole === role && h.fromPerson === userId) ||
        (h.toRole === role && h.toPerson === userId)
    );
  }
  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPendingHandovers(
  role: Role,
  userId: string
): Promise<HandoverRecord[]> {
  const all = await getHandoverRecords(role, userId);
  return all.filter(
    (h) => h.status === 'pending' || h.status === 'in_progress' || h.status === 'blocked'
  );
}

export async function updateHandoverStatus(
  handoverId: string,
  status: HandoverRecord['status'],
  operator: { id: string; name: string; role: Role },
  remark?: string
): Promise<HandoverRecord | undefined> {
  const idx = handoverRecords.findIndex((h) => h.id === handoverId);
  if (idx === -1) return undefined;

  const oldStatus = handoverRecords[idx].status;
  handoverRecords[idx] = {
    ...handoverRecords[idx],
    status,
    remark: remark || handoverRecords[idx].remark,
    receivedAt: status === 'completed' ? new Date().toISOString() : handoverRecords[idx].receivedAt,
    updatedAt: new Date().toISOString(),
  };

  addStatusTransition(
    handoverId,
    'handover',
    oldStatus,
    status,
    operator,
    remark
  );

  addLog({
    type: 'handover',
    targetId: handoverId,
    targetType: '交接记录',
    action: `状态变更为${status}`,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    detail: remark || `交接状态变更为：${status}`,
  });

  return handoverRecords[idx];
}

export async function getTodoItems(
  role?: Role,
  userId?: string,
  status?: string
): Promise<TodoItem[]> {
  let result = [...todoItems];
  if (role && userId) {
    result = result.filter((t) => t.role === role && t.assigneeId === userId);
  } else if (role) {
    result = result.filter((t) => t.role === role);
  }
  if (status && status !== 'all') {
    result = result.filter((t) => t.status === status);
  }
  return result.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function updateTodoStatus(
  todoId: string,
  status: TodoItem['status'],
  operator: { id: string; name: string; role: Role }
): Promise<TodoItem | undefined> {
  const idx = todoItems.findIndex((t) => t.id === todoId);
  if (idx === -1) return undefined;

  const oldStatus = todoItems[idx].status;
  todoItems[idx] = {
    ...todoItems[idx],
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
  };

  addStatusTransition(
    todoId,
    'todo',
    oldStatus,
    status,
    operator
  );

  return todoItems[idx];
}

export async function getStatusTransitions(
  targetId?: string,
  targetType?: string
): Promise<StatusTransition[]> {
  let result = [...statusTransitions];
  if (targetId) {
    result = result.filter((s) => s.targetId === targetId);
  }
  if (targetType) {
    result = result.filter((s) => s.targetType === targetType);
  }
  return result.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getDashboardAlerts(
  role: Role,
  userId: string
): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];
  const [todos, handovers, reminders, subs] = await Promise.all([
    getTodoItems(role, userId),
    getPendingHandovers(role, userId),
    getSigningReminders(),
    getSubscriptions(),
  ]);

  let filteredReminders = reminders;
  let filteredSubs = subs;

  if (role === 'consultant') {
    filteredReminders = reminders.filter((r) => r.assignedTo === userId);
    filteredSubs = subs.filter((s) => s.consultantId === userId);
  } else if (role === 'controller') {
    filteredReminders = reminders.filter((r) => r.assignedRole === 'controller');
    filteredSubs = subs.filter((s) => s.controllerId === userId);
  }

  const criticalCount = filteredReminders.filter(
    (r) => r.urgency === 'critical'
  ).length;
  if (criticalCount > 0) {
    alerts.push({
      id: 'alert-critical',
      type: 'critical',
      title: `有 ${criticalCount} 笔签约即将到期`,
      description: '请立即跟进处理，避免客户流失',
      actionText: '立即处理',
      actionTarget: 'signing',
      count: criticalCount,
    });
  }

  const highPriorityTodos = todos.filter(
    (t) => t.priority === 'high' && t.status === 'pending'
  ).length;
  if (highPriorityTodos > 0) {
    alerts.push({
      id: 'alert-todo',
      type: 'warning',
      title: `${highPriorityTodos} 项高优先级待办`,
      description: '请优先处理高优先级任务',
      actionText: '查看待办',
      count: highPriorityTodos,
    });
  }

  const blockedHandovers = handovers.filter((h) => h.status === 'blocked').length;
  const delayedHandovers = handovers.filter((h) => h.status === 'delayed').length;
  if (blockedHandovers > 0 || delayedHandovers > 0) {
    alerts.push({
      id: 'alert-handover',
      type: 'warning',
      title: `${blockedHandovers + delayedHandovers} 个交接存在问题`,
      description: `${blockedHandovers} 个阻塞 / ${delayedHandovers} 个延误`,
      actionText: '查看交接',
      count: blockedHandovers + delayedHandovers,
    });
  }

  const materialIssues = filteredSubs.filter(
    (s) => s.materialStatus === 'returned'
  ).length;
  if (materialIssues > 0) {
    alerts.push({
      id: 'alert-material',
      type: 'warning',
      title: `${materialIssues} 笔资料被退回`,
      description: '需要客户补充资料后重新提交',
      actionText: '去处理',
      actionTarget: 'materials',
      count: materialIssues,
    });
  }

  const modifiedMaterialReminders = filteredReminders.filter(
    (r) => r.materialModified
  ).length;
  if (modifiedMaterialReminders > 0 && role === 'consultant') {
    alerts.push({
      id: 'alert-material-modified',
      type: 'warning',
      title: `${modifiedMaterialReminders} 笔资料已变更`,
      description: '需重新通知客户确认变更内容',
      actionText: '查看提醒',
      actionTarget: 'signing',
      count: modifiedMaterialReminders,
    });
  }

  return alerts;
}

export async function getRoleWorkloads(): Promise<RoleWorkload[]> {
  const workloads: RoleWorkload[] = [];
  const roles: Role[] = ['manager', 'consultant', 'controller'];

  for (const role of roles) {
    const roleTodos = todoItems.filter((t) => t.role === role);
    const pendingCount = roleTodos.filter((t) => t.status === 'pending').length;
    const overdueCount = roleTodos.filter(
      (t) => t.status === 'pending' && t.dueAt && new Date(t.dueAt) < new Date()
    ).length;
    const todayCompleted = roleTodos.filter(
      (t) =>
        t.status === 'completed' &&
        t.completedAt &&
        new Date(t.completedAt).toDateString() === new Date().toDateString()
    ).length;

    workloads.push({
      role,
      roleName: roleLabels[role],
      pendingCount,
      overdueCount,
      todayCompleted,
    });
  }

  return workloads;
}

export async function getHandoverChain(targetId: string, targetType: string) {
  const relevantHandovers = handoverRecords.filter(
    (h) => h.targetId === targetId
  );

  const transitions = await getStatusTransitions(targetId, targetType);

  return {
    handovers: relevantHandovers,
    transitions,
  };
}

export async function resetAllData(): Promise<void> {
  customers = [...mockCustomers];
  visitRecords = [...mockVisitRecords];
  followUpRecords = [...mockFollowUpRecords];
  subscriptions = [...mockSubscriptions];
  subscriptionMaterials = [...mockSubscriptionMaterials];
  signingReminders = [...mockSigningReminders];
  operationLogs = [...mockOperationLogs];
  handoverRecords = [...mockHandoverRecords];
  todoItems = [...mockTodoItems];
  statusTransitions = [...mockStatusTransitions];
}

export async function getDashboardStats(role: Role, userId: string) {
  const allSubs = await getSubscriptions();
  const allReminders = await getSigningReminders();
  const allFollows = await getFollowUpRecords();
  const allTodos = await getTodoItems(role, userId);
  const allHandovers = await getPendingHandovers(role, userId);

  let subs = allSubs;
  let reminders = allReminders;
  let follows = allFollows;

  if (role === 'consultant') {
    subs = allSubs.filter((s) => s.consultantId === userId);
    reminders = allReminders.filter((r) => r.assignedTo === userId);
    follows = allFollows.filter((f) => f.consultantId === userId);
  } else if (role === 'controller') {
    subs = allSubs.filter((s) => s.controllerId === userId);
    reminders = allReminders.filter((r) => r.assignedRole === 'controller');
  }

  const criticalCount = reminders.filter((r) => r.urgency === 'critical').length;
  const urgentCount = reminders.filter((r) => r.urgency === 'urgent').length;
  const materialIssues = subs.filter((s) => s.materialStatus === 'returned').length;
  const modifiedSubs = subs.filter((s) => s.modifiedCount > 0).length;
  const overdueFollows = follows.filter((f) => f.status === 'overdue').length;
  const pendingReminders = reminders.filter(
    (r) => r.status === 'pending' || r.status === 'reminded'
  ).length;

  const highPriorityTodos = allTodos.filter(
    (t) => t.priority === 'high' && t.status === 'pending'
  ).length;
  const blockedHandovers = allHandovers.filter(
    (h) => h.status === 'blocked' || h.status === 'delayed'
  ).length;

  return {
    totalSubscriptions: subs.length,
    pendingSignings: pendingReminders,
    criticalCount,
    urgentCount,
    materialIssues,
    modifiedSubs,
    overdueFollows,
    totalReminders: reminders.length,
    highPriorityTodos,
    blockedHandovers,
    pendingTodoCount: allTodos.filter((t) => t.status === 'pending').length,
  };
}
