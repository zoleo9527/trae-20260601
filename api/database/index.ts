import { User, Table, Queue, Assignment, SystemLog } from '../types';

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date) => {
  return date.toISOString();
};

class MemoryDatabase {
  private users: Map<string, User> = new Map();
  private tables: Map<string, Table> = new Map();
  private queues: Map<string, Queue> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private logs: Map<string, SystemLog> = new Map();

  initialize() {
    this.seedInitialData();
  }

  private seedInitialData() {
    if (this.users.size === 0) {
      this.users.set('u1', { id: 'u1', username: 'manager', password: '123456', role: 'manager', name: '前厅经理' });
      this.users.set('u2', { id: 'u2', username: 'chef', password: '123456', role: 'chef', name: '后厨主管' });
      this.users.set('u3', { id: 'u3', username: 'cashier', password: '123456', role: 'cashier', name: '收银员' });
      this.users.set('u4', { id: 'u4', username: 'admin', password: '123456', role: 'admin', name: '管理员' });
    }

    if (this.tables.size === 0) {
      this.tables.set('t1', { id: 't1', name: 'A1', capacity: 4, status: 'available', position: '一楼大厅左侧' });
      this.tables.set('t2', { id: 't2', name: 'A2', capacity: 4, status: 'available', position: '一楼大厅右侧' });
      this.tables.set('t3', { id: 't3', name: 'B1', capacity: 6, status: 'available', position: '二楼包间1' });
      this.tables.set('t4', { id: 't4', name: 'B2', capacity: 6, status: 'available', position: '二楼包间2' });
      this.tables.set('t5', { id: 't5', name: 'C1', capacity: 8, status: 'available', position: '三楼VIP包间' });
      this.tables.set('t6', { id: 't6', name: 'D1', capacity: 2, status: 'available', position: '一楼吧台' });
      this.tables.set('t7', { id: 't7', name: 'D2', capacity: 2, status: 'available', position: '一楼吧台' });
      this.tables.set('t8', { id: 't8', name: 'E1', capacity: 10, status: 'available', position: '宴会厅' });
    }

    if (this.queues.size === 0) {
      const now = new Date().toISOString();
      this.queues.set('q1', { id: 'q1', customerName: '张三', phone: '13800138001', partySize: 4, status: 'waiting', createdAt: now, updatedAt: now, submittedBy: 'u1', submittedByName: '前厅经理' });
      this.queues.set('q2', { id: 'q2', customerName: '李四', phone: '13800138002', partySize: 6, status: 'waiting', createdAt: now, updatedAt: now, submittedBy: 'u1', submittedByName: '前厅经理' });
      this.queues.set('q3', { id: 'q3', customerName: '王五', phone: '13800138003', partySize: 2, status: 'seated', createdAt: now, updatedAt: now, submittedBy: 'u1', submittedByName: '前厅经理', assignedTableId: 't6', assignedTableName: 'D1' });
    }
  }

  // Users
  getUserByCredentials(username: string, password: string): User | null {
    for (const user of this.users.values()) {
      if (user.username === username && user.password === password) {
        return user;
      }
    }
    return null;
  }

  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Tables
  getAllTables(): Table[] {
    return Array.from(this.tables.values());
  }

  getTableById(id: string): Table | null {
    return this.tables.get(id) || null;
  }

  createTable(name: string, capacity: number, position?: string): Table {
    const id = generateId();
    const table: Table = { id, name, capacity, status: 'available', position: position || '' };
    this.tables.set(id, table);
    return table;
  }

  updateTableStatus(id: string, status: Table['status']): Table | null {
    const table = this.tables.get(id);
    if (!table) return null;
    table.status = status;
    this.tables.set(id, table);
    return table;
  }

  updateTable(id: string, name?: string, capacity?: number, position?: string): Table | null {
    const table = this.tables.get(id);
    if (!table) return null;
    if (name) table.name = name;
    if (capacity !== undefined) table.capacity = capacity;
    if (position !== undefined) table.position = position;
    this.tables.set(id, table);
    return table;
  }

  deleteTable(id: string): boolean {
    return this.tables.delete(id);
  }

  // Queues
  getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  getQueueById(id: string): Queue | null {
    return this.queues.get(id) || null;
  }

  createQueue(customerName: string, phone: string, partySize: number, submittedBy: string): Queue {
    const id = generateId();
    const now = new Date().toISOString();
    const user = this.getUserById(submittedBy);
    const queue: Queue = {
      id,
      customerName,
      phone,
      partySize,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      submittedBy,
      submittedByName: user?.name || '',
    };
    this.queues.set(id, queue);
    return queue;
  }

  updateQueueStatus(id: string, status: Queue['status']): Queue | null {
    const queue = this.queues.get(id);
    if (!queue) return null;
    queue.status = status;
    queue.updatedAt = new Date().toISOString();
    
    if (status === 'completed' && queue.assignedTableId) {
      const table = this.tables.get(queue.assignedTableId);
      if (table) {
        table.status = 'available';
        this.tables.set(queue.assignedTableId, table);
      }
    }
    
    this.queues.set(id, queue);
    return queue;
  }

  assignTable(queueId: string, tableId: string): Queue | null {
    const queue = this.queues.get(queueId);
    const table = this.tables.get(tableId);
    if (!queue || !table) return null;
    
    queue.assignedTableId = tableId;
    queue.assignedTableName = table.name;
    queue.status = 'seated';
    queue.updatedAt = new Date().toISOString();
    this.queues.set(queueId, queue);
    
    table.status = 'occupied';
    this.tables.set(tableId, table);
    
    return queue;
  }

  deleteQueue(id: string): boolean {
    return this.queues.delete(id);
  }

  // Assignments
  getAllAssignments(): Assignment[] {
    return Array.from(this.assignments.values());
  }

  createAssignment(queueId: string, tableId: string, assignedBy: string): Assignment {
    const id = generateId();
    const now = new Date().toISOString();
    const user = this.getUserById(assignedBy);
    const assignment: Assignment = {
      id,
      queueId,
      tableId,
      assignedBy,
      assignedByName: user?.name || '',
      assignedAt: now,
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  // Logs
  getAllLogs(): SystemLog[] {
    return Array.from(this.logs.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createLog(userId: string, userName: string, action: string, targetType: string, targetId?: string, details?: string): SystemLog {
    const id = generateId();
    const now = new Date().toISOString();
    const log: SystemLog = {
      id,
      userId,
      userName,
      action,
      targetType,
      targetId: targetId || '',
      createdAt: now,
      details: details || '',
    };
    this.logs.set(id, log);
    return log;
  }
}

export const db = new MemoryDatabase();
db.initialize();
