import type { User, SoupBase, SoldOutItem, Order, AuditLog, TodoItem, SoldOutHistory } from '@/types';
import { seedUsers, seedSoupBases, seedSoldOutItems, seedOrders, seedAuditLogs, seedTodos } from '@/data/seedData';

let users: User[] = [...seedUsers];
let soupBases: SoupBase[] = [...seedSoupBases];
let soldOutItems: SoldOutItem[] = [...seedSoldOutItems];
let orders: Order[] = [...seedOrders];
let auditLogs: AuditLog[] = [...seedAuditLogs];
let todos: TodoItem[] = [...seedTodos];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTimestamp = () => new Date().toISOString();

export const userApi = {
  getAll: (): Promise<User[]> => Promise.resolve(users),
  getById: (id: string): Promise<User | undefined> => Promise.resolve(users.find(u => u.id === id)),
  getByRole: (role: User['role']): Promise<User[]> => Promise.resolve(users.filter(u => u.role === role)),
  login: (phone: string): Promise<User | null> => {
    const user = users.find(u => u.phone === phone);
    return Promise.resolve(user || null);
  },
};

export const soupBaseApi = {
  getAll: (): Promise<SoupBase[]> => Promise.resolve(soupBases),
  getById: (id: string): Promise<SoupBase | undefined> => Promise.resolve(soupBases.find(s => s.id === id)),
  create: async (data: Omit<SoupBase, 'id' | 'createdAt' | 'updatedAt' | 'prepareCount'>): Promise<SoupBase> => {
    const now = formatTimestamp();
    const newItem: SoupBase = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      prepareCount: 0,
    };
    soupBases.push(newItem);
    await auditLogApi.create({
      action: 'create',
      targetType: 'soupBase',
      targetId: newItem.id,
      targetName: newItem.name,
      actor: '李主管',
      actorRole: '后厨主管',
      details: data,
    });
    return newItem;
  },
  update: async (id: string, data: Partial<Omit<SoupBase, 'id' | 'createdAt'>>): Promise<SoupBase | undefined> => {
    const index = soupBases.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const previousStock = soupBases[index].stock;
    const updated = { ...soupBases[index], ...data, updatedAt: formatTimestamp() };
    soupBases[index] = updated;
    
    await auditLogApi.create({
      action: 'update',
      targetType: 'soupBase',
      targetId: id,
      targetName: updated.name,
      actor: '李主管',
      actorRole: '后厨主管',
      details: { ...data, previousStock },
    });
    return updated;
  },
  prepare: async (id: string): Promise<SoupBase | undefined> => {
    const index = soupBases.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const now = formatTimestamp();
    soupBases[index] = {
      ...soupBases[index],
      status: 'preparing',
      updatedAt: now,
    };
    return soupBases[index];
  },
  completePrepare: async (id: string, quantity: number): Promise<SoupBase | undefined> => {
    const index = soupBases.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const now = formatTimestamp();
    soupBases[index] = {
      ...soupBases[index],
      stock: soupBases[index].stock + quantity,
      status: 'ready',
      lastPreparedAt: now,
      updatedAt: now,
      prepareCount: soupBases[index].prepareCount + 1,
    };
    
    await auditLogApi.create({
      action: 'update',
      targetType: 'soupBase',
      targetId: id,
      targetName: soupBases[index].name,
      actor: '李主管',
      actorRole: '后厨主管',
      details: { preparedQuantity: quantity, newStock: soupBases[index].stock },
    });
    return soupBases[index];
  },
  getLowStock: (): Promise<SoupBase[]> => {
    return Promise.resolve(soupBases.filter(s => s.stock <= s.minStock));
  },
};

export const soldOutApi = {
  getAll: (status?: SoldOutItem['status']): Promise<SoldOutItem[]> => {
    if (status) {
      return Promise.resolve(soldOutItems.filter(s => s.status === status));
    }
    return Promise.resolve(soldOutItems);
  },
  getById: (id: string): Promise<SoldOutItem | undefined> => {
    return Promise.resolve(soldOutItems.find(s => s.id === id));
  },
  create: async (data: Omit<SoldOutItem, 'id' | 'status' | 'history' | 'reportedAt'>): Promise<SoldOutItem> => {
    const now = formatTimestamp();
    const history: SoldOutHistory[] = [{
      id: generateId(),
      action: 'reported',
      actor: data.reportedBy,
      timestamp: now,
      description: `报告${data.itemName}沽清`,
    }];
    
    const newItem: SoldOutItem = {
      ...data,
      id: generateId(),
      status: 'active',
      history,
      reportedAt: now,
    };
    soldOutItems.push(newItem);
    
    await auditLogApi.create({
      action: 'create',
      targetType: 'soldOut',
      targetId: newItem.id,
      targetName: newItem.itemName,
      actor: data.reportedBy,
      actorRole: '后厨主管',
      details: { reason: data.reason },
    });
    
    await todoApi.create({
      title: `确认${data.itemName}沽清通知`,
      type: 'soldOut',
      targetId: newItem.id,
      targetName: newItem.itemName,
      assignee: '张经理',
      assigneeRole: '前厅经理',
      priority: 'medium',
    });
    
    return newItem;
  },
  confirm: async (id: string, actor: string, actorRole: User['role']): Promise<SoldOutItem | undefined> => {
    const index = soldOutItems.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const history: SoldOutHistory = {
      id: generateId(),
      action: 'confirmed',
      actor,
      timestamp: formatTimestamp(),
      description: '确认沽清通知已发送',
    };
    
    soldOutItems[index] = {
      ...soldOutItems[index],
      history: [...soldOutItems[index].history, history],
    };
    
    await auditLogApi.create({
      action: 'confirm',
      targetType: 'soldOut',
      targetId: id,
      targetName: soldOutItems[index].itemName,
      actor,
      actorRole,
      details: { confirmed: true },
    });
    
    return soldOutItems[index];
  },
  resolve: async (id: string, resolvedBy: string, notes?: string): Promise<SoldOutItem | undefined> => {
    const index = soldOutItems.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const now = formatTimestamp();
    const history: SoldOutHistory = {
      id: generateId(),
      action: 'resolved',
      actor: resolvedBy,
      timestamp: now,
      description: `${soldOutItems[index].itemName}已补货`,
    };
    
    soldOutItems[index] = {
      ...soldOutItems[index],
      status: 'resolved',
      resolvedBy,
      resolvedAt: now,
      history: [...soldOutItems[index].history, history],
      notes: notes || soldOutItems[index].notes,
    };
    
    await auditLogApi.create({
      action: 'resolve',
      targetType: 'soldOut',
      targetId: id,
      targetName: soldOutItems[index].itemName,
      actor: resolvedBy,
      actorRole: '后厨主管',
      details: { resolvedBy, notes },
    });
    
    return soldOutItems[index];
  },
  updateNotes: async (id: string, notes: string): Promise<SoldOutItem | undefined> => {
    const index = soldOutItems.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const history: SoldOutHistory = {
      id: generateId(),
      action: 'updated',
      actor: '李主管',
      timestamp: formatTimestamp(),
      description: '更新备注信息',
    };
    
    soldOutItems[index] = {
      ...soldOutItems[index],
      notes,
      history: [...soldOutItems[index].history, history],
    };
    
    return soldOutItems[index];
  },
};

export const orderApi = {
  getAll: (status?: Order['status']): Promise<Order[]> => {
    if (status) {
      return Promise.resolve(orders.filter(o => o.status === status));
    }
    return Promise.resolve(orders);
  },
  getById: (id: string): Promise<Order | undefined> => Promise.resolve(orders.find(o => o.id === id)),
  create: async (data: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    const now = formatTimestamp();
    const newOrder: Order = {
      ...data,
      id: generateId(),
      createdAt: now,
    };
    orders.push(newOrder);
    
    await auditLogApi.create({
      action: 'create',
      targetType: 'order',
      targetId: newOrder.id,
      targetName: `${newOrder.tableNumber}桌订单`,
      actor: data.createdBy,
      actorRole: '前厅经理',
      details: { isGroupBuy: data.isGroupBuy },
    });
    
    if (data.isGroupBuy && !data.groupBuyVerified) {
      await todoApi.create({
        title: `核销团购券 ${data.groupBuyCode}`,
        type: 'order',
        targetId: newOrder.id,
        targetName: `${newOrder.tableNumber}桌订单`,
        assignee: '王收银',
        assigneeRole: '收银',
        priority: 'medium',
      });
    }
    
    return newOrder;
  },
  verifyGroupBuy: async (id: string): Promise<Order | undefined> => {
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    orders[index] = {
      ...orders[index],
      groupBuyVerified: true,
      status: 'confirmed',
    };
    
    await auditLogApi.create({
      action: 'confirm',
      targetType: 'order',
      targetId: id,
      targetName: orders[index].tableNumber + '桌订单',
      actor: '王收银',
      actorRole: '收银',
      details: { groupBuyVerified: true },
    });
    
    return orders[index];
  },
  updateStatus: async (id: string, status: Order['status']): Promise<Order | undefined> => {
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    const now = formatTimestamp();
    const updates: Partial<Order> = { status, updatedAt: now };
    
    if (status === 'served') updates.servedAt = now;
    if (status === 'completed') updates.completedAt = now;
    
    orders[index] = { ...orders[index], ...updates };
    
    await auditLogApi.create({
      action: 'update',
      targetType: 'order',
      targetId: id,
      targetName: orders[index].tableNumber + '桌订单',
      actor: '张经理',
      actorRole: '前厅经理',
      details: { status },
    });
    
    return orders[index];
  },
};

export const auditLogApi = {
  getAll: (): Promise<AuditLog[]> => Promise.resolve(auditLogs),
  getByTargetType: (type: AuditLog['targetType']): Promise<AuditLog[]> => {
    return Promise.resolve(auditLogs.filter(a => a.targetType === type));
  },
  getByActor: (actor: string): Promise<AuditLog[]> => {
    return Promise.resolve(auditLogs.filter(a => a.actor === actor));
  },
  create: async (data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> => {
    const newLog: AuditLog = {
      ...data,
      id: generateId(),
      timestamp: formatTimestamp(),
    };
    auditLogs.push(newLog);
    return newLog;
  },
};

export const todoApi = {
  getAll: (): Promise<TodoItem[]> => Promise.resolve(todos),
  getByAssignee: (assignee: string): Promise<TodoItem[]> => {
    return Promise.resolve(todos.filter(t => t.assignee === assignee));
  },
  getByRole: (role: User['role']): Promise<TodoItem[]> => {
    return Promise.resolve(todos.filter(t => t.assigneeRole === role));
  },
  getPending: (): Promise<TodoItem[]> => {
    return Promise.resolve(todos.filter(t => !t.completed));
  },
  create: async (data: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>): Promise<TodoItem> => {
    const newTodo: TodoItem = {
      ...data,
      id: generateId(),
      createdAt: formatTimestamp(),
      completed: false,
    };
    todos.push(newTodo);
    return newTodo;
  },
  complete: async (id: string): Promise<TodoItem | undefined> => {
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    todos[index] = {
      ...todos[index],
      completed: true,
      completedAt: formatTimestamp(),
    };
    return todos[index];
  },
};
