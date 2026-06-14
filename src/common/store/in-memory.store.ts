import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '../types/user.type';
import { LeaveRequest } from '../types/leave.type';
import { MakeupCoordination } from '../types/makeup.type';
import { OperationLog } from '../types/operation-log.type';
import { ExportTask } from '../types/export-task.type';
import { MOCK_USERS, MOCK_LEAVES, MOCK_MAKEUPS } from '../data/mock-data';

export interface IdemRecord {
  entityType: 'LEAVE' | 'MAKEUP' | 'EXPORT';
  entityId: string | null;
  action: string;
  actorId: string;
  timestamp: string;
}

@Injectable()
export class InMemoryStore implements OnModuleInit {
  private users: Map<string, User> = new Map();
  private leaves: Map<string, LeaveRequest> = new Map();
  private leaveIdemKeys: Map<string, string> = new Map();
  private makeups: Map<string, MakeupCoordination> = new Map();
  private makeupIdemKeys: Map<string, string> = new Map();
  private exportTaskIdemKeys: Map<string, string> = new Map();
  private operationLogs: OperationLog[] = [];
  private exportTasks: Map<string, ExportTask> = new Map();
  private operationIdemKeys: Map<string, IdemRecord> = new Map();

  onModuleInit() {
    MOCK_USERS.forEach((u) => this.users.set(u.id, u));
    MOCK_LEAVES.forEach((l) => {
      this.leaves.set(l.id, l);
      if (l.idempotencyKey) this.leaveIdemKeys.set(l.idempotencyKey, l.id);
    });
    MOCK_MAKEUPS.forEach((m) => {
      this.makeups.set(m.id, m);
      if (m.idempotencyKey) this.makeupIdemKeys.set(m.idempotencyKey, m.id);
    });
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  findUsersByRole(role: string): User[] {
    return Array.from(this.users.values()).filter((u) => u.role === role);
  }

  listAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  saveLeave(leave: LeaveRequest): LeaveRequest {
    this.leaves.set(leave.id, leave);
    if (leave.idempotencyKey) this.leaveIdemKeys.set(leave.idempotencyKey, leave.id);
    return leave;
  }

  getLeave(id: string): LeaveRequest | undefined {
    return this.leaves.get(id);
  }

  listLeaves(): LeaveRequest[] {
    return Array.from(this.leaves.values());
  }

  findLeaveByIdemKey(key: string): LeaveRequest | undefined {
    const id = this.leaveIdemKeys.get(key);
    return id ? this.leaves.get(id) : undefined;
  }

  saveMakeup(makeup: MakeupCoordination): MakeupCoordination {
    this.makeups.set(makeup.id, makeup);
    if (makeup.idempotencyKey) this.makeupIdemKeys.set(makeup.idempotencyKey, makeup.id);
    return makeup;
  }

  getMakeup(id: string): MakeupCoordination | undefined {
    return this.makeups.get(id);
  }

  listMakeups(): MakeupCoordination[] {
    return Array.from(this.makeups.values());
  }

  findMakeupByLeaveId(leaveId: string): MakeupCoordination | undefined {
    return Array.from(this.makeups.values()).find((m) => m.leaveId === leaveId);
  }

  findMakeupByIdemKey(key: string): MakeupCoordination | undefined {
    const id = this.makeupIdemKeys.get(key);
    return id ? this.makeups.get(id) : undefined;
  }

  pushOperationLog(log: OperationLog): void {
    this.operationLogs.push(log);
  }

  listOperationLogs(entityType?: string, entityId?: string): OperationLog[] {
    return this.operationLogs.filter(
      (l) =>
        (!entityType || l.entityType === entityType) &&
        (!entityId || l.entityId === entityId),
    ).sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
  }

  getExportTask(id: string): ExportTask | undefined {
    return this.exportTasks.get(id);
  }

  listExportTasks(): ExportTask[] {
    return Array.from(this.exportTasks.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  saveExportTask(task: ExportTask): ExportTask {
    this.exportTasks.set(task.id, task);
    if (task.idempotencyKey) this.exportTaskIdemKeys.set(task.idempotencyKey, task.id);
    return task;
  }

  findExportTaskByIdemKey(key: string): ExportTask | undefined {
    const id = this.exportTaskIdemKeys.get(key);
    return id ? this.exportTasks.get(id) : undefined;
  }

  checkAndSetOperationIdem(
    idemKey: string,
    entityType: 'LEAVE' | 'MAKEUP' | 'EXPORT',
    entityId: string | null,
    action: string,
    actorId: string,
  ): IdemRecord | null {
    if (!idemKey) return null;
    if (this.operationIdemKeys.has(idemKey)) {
      return this.operationIdemKeys.get(idemKey)!;
    }
    const record: IdemRecord = {
      entityType,
      entityId,
      action,
      actorId,
      timestamp: new Date().toISOString(),
    };
    this.operationIdemKeys.set(idemKey, record);
    return null;
  }

  findOperationIdem(idemKey: string): IdemRecord | undefined {
    return idemKey ? this.operationIdemKeys.get(idemKey) : undefined;
  }
}
