import { 
  ReservationRepository, 
  BeverageStorageRepository, 
  SingerScheduleRepository,
  StatusHistoryRepository,
  TodoItemRepository,
  IssueDetectionRepository
} from '../repositories/index.js';
import type { StaffRole, ReservationStatus, MinimumConsumptionStatus } from '../models/types.js';

const reservationRepo = new ReservationRepository();
const beverageRepo = new BeverageStorageRepository();
const singerRepo = new SingerScheduleRepository();
const historyRepo = new StatusHistoryRepository();
const todoRepo = new TodoItemRepository();
const issueRepo = new IssueDetectionRepository();

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  duplicates: any[];
  conflictType?: 'phone' | 'table';
  message?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: any[];
  conflictType?: 'table' | 'singer_schedule';
  message?: string;
}

export interface IssueCheckResult {
  hasIssues: boolean;
  issues: any[];
}

export function normalizeDate(date: string | Date | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

export class ReservationService {
  async createReservation(data: any, staffId: string, staffRole: StaffRole) {
    const duplicateCheck = this.checkDuplicateReservations(
      data.customerPhone, 
      data.reservationDate, 
      data.tableNumber,
      data.reservationTime
    );

    const reservation = reservationRepo.create({
      ...data,
      reservationDate: typeof data.reservationDate === 'string' 
        ? new Date(data.reservationDate) 
        : data.reservationDate,
      status: 'pending',
      minimumConsumptionStatus: 'pending',
      reservationStaffId: staffId
    });

    if (duplicateCheck.hasDuplicate) {
      await issueRepo.create({
        reservationId: reservation.id,
        issueType: 'duplicate_reservation',
        severity: duplicateCheck.conflictType === 'phone' ? 'warning' : 'error',
        description: duplicateCheck.message || '检测到重复预约',
        resolved: false
      });

      await this.createTodoForRole(
        'reservation',
        reservation.id,
        'manager',
        `⚠️ 重复预约警告: ${data.customerName}`,
        duplicateCheck.message || '检测到与现有预约重复',
        'high'
      );
    }

    await this.recordStatusChange(
      'reservation',
      reservation.id,
      null,
      'pending',
      staffId,
      staffRole,
      '创建预约',
      data.internalNotes
    );

    await this.createTodoForRole(
      'reservation',
      reservation.id,
      'manager',
      `新预约待确认: ${data.customerName} - ${data.tableNumber}`,
      `客户: ${data.customerName}\n电话: ${data.customerPhone}\n人数: ${data.partySize}\n备注: ${data.notes || ''}`,
      data.priority || 'medium'
    );

    return {
      reservation,
      duplicateCheck,
      issues: await issueRepo.findByReservationId(reservation.id)
    };
  }

  async processReservation(
    reservationId: string, 
    action: 'confirm' | 'reject' | 'return',
    staffId: string,
    staffRole: StaffRole,
    notes?: string,
    internalNotes?: string
  ) {
    const reservation = reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new Error('预约不存在');
    }

    const statusMap: Record<string, ReservationStatus> = {
      confirm: 'confirmed',
      reject: 'cancelled',
      return: 'returned'
    };

    const newStatus = statusMap[action];
    const previousStatus = reservation.status;

    if (newStatus === 'confirmed' && action === 'confirm') {
      await this.createTodoForRole(
        'minimum_consumption',
        reservationId,
        'reservation_staff',
        `低消待确认: ${reservation.customerName}`,
        `桌台: ${reservation.tableNumber}\n日期: ${reservation.reservationDate}\n时间: ${reservation.reservationTime}\n内部备注: ${internalNotes || reservation.internalNotes || ''}`,
        reservation.priority
      );
    }

    const updated = reservationRepo.update(reservationId, {
      status: newStatus,
      internalNotes: internalNotes || reservation.internalNotes
    });

    await this.recordStatusChange(
      'reservation',
      reservationId,
      previousStatus,
      newStatus,
      staffId,
      staffRole,
      this.getActionDescription(action),
      notes
    );

    await this.updateRelatedTodos('reservation', reservationId, {
      status: action === 'confirm' ? 'completed' : 'cancelled'
    });

    return updated;
  }

  async updateMinimumConsumption(
    reservationId: string,
    amount: number,
    status: MinimumConsumptionStatus,
    staffId: string,
    staffRole: StaffRole,
    notes?: string
  ) {
    const reservation = reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.status !== 'confirmed') {
      throw new Error('低消只能在预约已确认后执行');
    }

    const previousStatus = reservation.minimumConsumptionStatus;
    const previousAmount = reservation.minimumConsumptionAmount;

    const updated = reservationRepo.update(reservationId, {
      minimumConsumptionAmount: amount,
      minimumConsumptionStatus: status
    });

    await this.recordStatusChange(
      'minimum_consumption',
      reservationId,
      previousStatus || 'pending',
      status,
      staffId,
      staffRole,
      `低消金额: ${previousAmount || 0} → ${amount}`,
      notes
    );

    if (status === 'confirmed') {
      await this.createTodoForRole(
        'reservation',
        reservationId,
        'manager',
        `预约已确认: ${reservation.customerName}`,
        `低消已确认: ¥${amount}`,
        'low'
      );
    }

    return updated;
  }

  checkDuplicateReservations(
    customerPhone: string,
    reservationDate: string,
    tableNumber: string,
    reservationTime: string,
    excludeId?: string
  ): DuplicateCheckResult {
    const phoneDuplicates = reservationRepo.findDuplicates(customerPhone, reservationDate, excludeId);
    const tableConflicts = reservationRepo.findTableConflicts(tableNumber, reservationDate, reservationTime, excludeId);

    if (phoneDuplicates.length > 0) {
      return {
        hasDuplicate: true,
        duplicates: phoneDuplicates,
        conflictType: 'phone',
        message: `检测到同一电话的重复预约: ${phoneDuplicates.length}条相关预约`
      };
    }

    if (tableConflicts.length > 0) {
      return {
        hasDuplicate: true,
        duplicates: tableConflicts,
        conflictType: 'table',
        message: `检测到桌台 ${tableNumber} 在此时段已有预约: ${tableConflicts.length}条冲突`
      };
    }

    return { hasDuplicate: false, duplicates: [] };
  }

  checkSingerScheduleConflicts(
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): ConflictCheckResult {
    const conflicts = singerRepo.findConflicts(date, startTime, endTime, excludeId);

    if (conflicts.length > 0) {
      return {
        hasConflict: true,
        conflicts,
        conflictType: 'singer_schedule',
        message: `检测到演出时间冲突: ${conflicts.length}条排班与此时间段重叠`
      };
    }

    return { hasConflict: false, conflicts: [] };
  }

  checkBeverageUnclearIssues(reservationId: string): IssueCheckResult {
    const unclearBeverages = beverageRepo.findUnclearByReservationId(reservationId);

    if (unclearBeverages.length > 0) {
      return {
        hasIssues: true,
        issues: unclearBeverages.map(b => ({
          type: 'beverage_unclear',
          beverageId: b.id,
          beverageName: b.beverageName,
          description: `寄存酒水 "${b.beverageName}" 状态为"说不清"`,
          severity: 'warning'
        }))
      };
    }

    return { hasIssues: false, issues: [] };
  }

  async checkAllIssuesForReservation(reservationId: string) {
    const issues: any[] = [];

    const duplicateIssues = issueRepo.findByReservationId(reservationId, false);
    issues.push(...duplicateIssues);

    const beverageIssues = this.checkBeverageUnclearIssues(reservationId);
    issues.push(...beverageIssues.issues);

    return issues;
  }

  private async createIssueDetection(
    reservationId: string,
    issueType: string,
    description: string,
    severity: 'warning' | 'error' | 'critical' = 'warning'
  ) {
    return issueRepo.create({
      reservationId,
      issueType: issueType as any,
      severity,
      description,
      resolved: false
    });
  }

  private async recordStatusChange(
    entityType: string,
    entityId: string,
    previousStatus: string | null,
    newStatus: string,
    changedBy: string,
    changedByRole: StaffRole,
    changeReason?: string,
    notes?: string
  ) {
    return historyRepo.create({
      entityType: entityType as any,
      entityId,
      previousStatus: previousStatus || undefined,
      newStatus,
      changedBy,
      changedByRole,
      changeReason,
      notes,
      timestamp: new Date()
    });
  }

  private async createTodoForRole(
    entityType: string,
    entityId: string,
    role: StaffRole,
    title: string,
    description?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) {
    return todoRepo.create({
      entityType: entityType as any,
      entityId,
      assigneeRole: role,
      title,
      description,
      priority: priority as any,
      status: 'pending'
    });
  }

  private async updateRelatedTodos(entityType: string, entityId: string, updates: any) {
    const todos = todoRepo.findByEntity(entityType, entityId);
    for (const todo of todos) {
      if (updates.status) {
        todoRepo.update(todo.id, { status: updates.status as any });
      }
    }
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      confirm: '确认预约',
      reject: '拒绝预约',
      return: '退回预约'
    };
    return descriptions[action] || action;
  }

  getReservationDetails(reservationId: string) {
    const reservation = reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new Error('预约不存在');
    }

    const beverages = beverageRepo.findByReservationId(reservationId);
    const reservationHistory = historyRepo.findByEntity('reservation', reservationId);
    const minConsumptionHistory = historyRepo.findByEntity('minimum_consumption', reservationId);
    const allStatusHistory = [...reservationHistory, ...minConsumptionHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const issues = issueRepo.findByReservationId(reservationId);
    
    const reservationTodos = todoRepo.findByEntity('reservation', reservationId);
    const minConsumptionTodos = todoRepo.findByEntity('minimum_consumption', reservationId);
    
    const beverageTodos = beverages.flatMap(beverage => 
      todoRepo.findByEntity('beverage_storage', beverage.id)
    );
    
    const allTodos = [...reservationTodos, ...minConsumptionTodos, ...beverageTodos].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      reservation,
      beverages,
      statusHistory: allStatusHistory,
      reservationHistory,
      minimumConsumptionHistory: minConsumptionHistory,
      issues,
      todos: allTodos
    };
  }

  getReservationsByFilters(filters: { status?: string; date?: string; role?: StaffRole }) {
    let reservations = reservationRepo.findAll({
      status: filters.status,
      date: filters.date
    });

    if (filters.role === 'reservation_staff') {
      reservations = reservations.filter(r => r.minimumConsumptionStatus === 'pending');
    }

    return reservations;
  }

  getStatusHistory(entityType: string, entityId: string) {
    return historyRepo.findByEntity(entityType, entityId);
  }
}

export class TodoService {
  getTodosByRole(role: StaffRole, status?: string) {
    return todoRepo.findByRole(role, status);
  }

  updateTodoStatus(todoId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    return todoRepo.update(todoId, { status: status as any });
  }

  getTodoDetails(todoId: string) {
    const todo = todoRepo.findById(todoId);
    if (!todo) {
      throw new Error('待办事项不存在');
    }

    const relatedHistory = historyRepo.findByEntity(todo.entityType, todo.entityId);

    return {
      todo,
      relatedHistory
    };
  }
}

export class SingerScheduleService {
  async createSchedule(data: any, managerId: string) {
    const conflictCheck = singerRepo.findConflicts(
      data.performanceDate,
      data.startTime,
      data.endTime
    );

    if (conflictCheck.length > 0) {
      throw new Error(`演出时间冲突: ${conflictCheck.length}条排班与此时间段重叠`);
    }

    const schedule = singerRepo.create({
      ...data,
      performanceDate: typeof data.performanceDate === 'string' 
        ? new Date(data.performanceDate) 
        : data.performanceDate,
      status: 'scheduled',
      managerId
    });

    await historyRepo.create({
      entityType: 'singer_schedule',
      entityId: schedule.id,
      newStatus: 'scheduled',
      changedBy: managerId,
      changedByRole: 'manager',
      changeReason: '创建演出排班',
      notes: data.notes,
      timestamp: new Date()
    });

    return schedule;
  }

  async reschedule(scheduleId: string, newDate: string, newStartTime: string, newEndTime: string, managerId: string, reason?: string) {
    const schedule = singerRepo.findById(scheduleId);
    if (!schedule) {
      throw new Error('排班记录不存在');
    }

    const conflictCheck = singerRepo.findConflicts(newDate, newStartTime, newEndTime, scheduleId);
    if (conflictCheck.length > 0) {
      throw new Error(`演出时间冲突: ${conflictCheck.length}条排班与此时间段重叠`);
    }

    const originalDate = schedule.performanceDate;
    const originalDateStr = normalizeDate(originalDate)!;
    const normalizedNewDate = normalizeDate(newDate)!;

    const updated = singerRepo.update(scheduleId, {
      performanceDate: new Date(normalizedNewDate),
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'rescheduled',
      originalDate: originalDate
    });

    await historyRepo.create({
      entityType: 'singer_schedule',
      entityId: scheduleId,
      previousStatus: schedule.status,
      newStatus: 'rescheduled',
      changedBy: managerId,
      changedByRole: 'manager',
      changeReason: reason || '演出改期',
      notes: `原日期: ${originalDateStr} → 新日期: ${normalizedNewDate}`,
      timestamp: new Date()
    });

    await this.createAlertForScheduleChange(scheduleId, originalDateStr, normalizedNewDate, reason);

    return updated;
  }

  private async createAlertForScheduleChange(scheduleId: string, originalDateStr: string, newDateStr: string, reason?: string) {
    const affectedReservations = reservationRepo.findAll({ 
      date: originalDateStr 
    });

    for (const reservation of affectedReservations) {
      await issueRepo.create({
        reservationId: reservation.id,
        issueType: 'schedule_conflict',
        severity: 'warning',
        description: `演出排班变更: ${reason || '演出改期'}`,
        relatedEntityId: scheduleId,
        resolved: false
      });

      await todoRepo.create({
        entityType: 'reservation',
        entityId: reservation.id,
        assigneeRole: 'manager',
        title: `⚠️ 演出变更通知: ${reservation.customerName}`,
        description: `演出从 ${originalDateStr} 改期至 ${newDateStr}\n原因: ${reason || '未说明'}`,
        priority: 'high',
        status: 'pending'
      });
    }
  }
}

export class BeverageStorageService {
  async createStorage(data: any, barStaffId: string) {
    const storage = beverageRepo.create({
      ...data,
      storageDate: typeof data.storageDate === 'string' 
        ? new Date(data.storageDate) 
        : data.storageDate,
      status: 'stored',
      barStaffId
    });

    await historyRepo.create({
      entityType: 'beverage_storage',
      entityId: storage.id,
      newStatus: 'stored',
      changedBy: barStaffId,
      changedByRole: 'bar_staff',
      changeReason: '创建寄存记录',
      notes: data.notes,
      timestamp: new Date()
    });

    const reservation = reservationRepo.findById(storage.reservationId);
    if (reservation) {
      await todoRepo.create({
        entityType: 'beverage_storage',
        entityId: storage.id,
        assigneeRole: 'bar_staff',
        title: `寄存记录已创建: ${storage.beverageName}`,
        description: `预约: ${reservation.customerName} (${reservation.tableNumber})\n数量: ${storage.quantity}\n备注: ${data.notes || ''}`,
        priority: 'low',
        status: 'pending'
      });
    }

    return storage;
  }

  async markAsUnclear(storageId: string, barStaffId: string, reason?: string) {
    const storage = beverageRepo.update(storageId, {
      status: 'unclear'
    });

    if (storage) {
      await historyRepo.create({
        entityType: 'beverage_storage',
        entityId: storageId,
        previousStatus: 'stored',
        newStatus: 'unclear',
        changedBy: barStaffId,
        changedByRole: 'bar_staff',
        changeReason: '标记为说不清',
        notes: reason,
        timestamp: new Date()
      });

      const unclearItems = beverageRepo.findUnclearByReservationId(storage.reservationId);
      if (unclearItems.length > 0) {
        const reservation = reservationRepo.findById(storage.reservationId);
        if (reservation) {
          await issueRepo.create({
            reservationId: storage.reservationId,
            issueType: 'beverage_unclear',
            severity: 'warning',
            description: `寄存酒水 "${storage.beverageName}" 无法确认`,
            relatedEntityId: storageId,
            resolved: false
          });

          await todoRepo.create({
            entityType: 'beverage_storage',
            entityId: storageId,
            assigneeRole: 'manager',
            title: `⚠️ 寄存酒待确认: ${storage.beverageName}`,
            description: reason || '寄存酒状态需要现场确认',
            priority: 'medium',
            status: 'pending'
          });
        }
      }
    }

    return storage;
  }

  async retrieveBeverage(storageId: string, barStaffId: string) {
    const storage = beverageRepo.update(storageId, {
      status: 'retrieved',
      retrieveDate: new Date()
    });

    if (storage) {
      await historyRepo.create({
        entityType: 'beverage_storage',
        entityId: storageId,
        previousStatus: 'stored',
        newStatus: 'retrieved',
        changedBy: barStaffId,
        changedByRole: 'bar_staff',
        changeReason: '取回酒水',
        timestamp: new Date()
      });
    }

    return storage;
  }
}

export const reservationService = new ReservationService();
export const todoService = new TodoService();
export const singerScheduleService = new SingerScheduleService();
export const beverageStorageService = new BeverageStorageService();
