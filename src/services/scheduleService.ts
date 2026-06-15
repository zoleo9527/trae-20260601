import { MockDatabase } from '../mock/database';
import { AuditLogService } from './auditLogService';
import {
  Order,
  OrderStatus,
  UserRole,
  ScheduleRecord,
  TimeSlot,
  TIME_SLOTS,
  AuditAction,
} from '../types';

export interface ScheduleQueryParams {
  installerId?: string;
  startDate?: string;
  endDate?: string;
  status?: ScheduleRecord['status'];
}

export interface AssignScheduleParams {
  orderId: string;
  installerId: string;
  assignedBy: string;
  scheduledDate: string;
  timeSlot: TimeSlot;
  estimatedDurationHours: number;
  travelNotes?: string;
  toolChecklist?: string[];
}

export interface ReassignScheduleParams {
  orderId: string;
  newInstallerId: string;
  reassignedBy: string;
  reason: string;
  scheduledDate?: string;
  timeSlot?: TimeSlot;
  estimatedDurationHours?: number;
}

export class ScheduleService {
  constructor(
    private db: MockDatabase,
    private auditService: AuditLogService
  ) {}

  assignSchedule(params: AssignScheduleParams): Order {
    const order = this.db.getOrder(params.orderId);
    if (!order) throw new Error(`Order ${params.orderId} not found`);
    const canAssign = [OrderStatus.APPOINTED, OrderStatus.REMINDED, OrderStatus.MATERIALS_NEEDED];
    if (!canAssign.includes(order.status)) {
      throw new Error(`Cannot assign schedule for order in status ${order.status}`);
    }
    const installer = this.db.getUser(params.installerId);
    if (!installer || installer.role !== UserRole.INSTALLER) {
      throw new Error(`Installer ${params.installerId} is invalid`);
    }
    if (!this.validateInstallerAvailability(params.installerId, params.scheduledDate, params.timeSlot)) {
      throw new Error(`Installer ${params.installerId} is not available on ${params.scheduledDate} ${params.timeSlot}`);
    }
    const schedule: ScheduleRecord = {
      id: this.db.generateId('SCH'),
      orderId: params.orderId,
      installerId: params.installerId,
      assignedBy: params.assignedBy,
      scheduledDate: params.scheduledDate,
      timeSlot: params.timeSlot,
      estimatedDurationHours: params.estimatedDurationHours,
      status: 'PENDING',
      travelNotes: params.travelNotes,
      toolChecklist: params.toolChecklist,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    order.schedule = schedule;
    if (order.status === OrderStatus.APPOINTED) {
      order.status = OrderStatus.INSTALLATION_SCHEDULED;
    }
    this.auditService.appendLog(order, AuditAction.SCHEDULE_ASSIGN, params.assignedBy, {
      scheduleId: schedule.id,
      installerId: params.installerId,
      installerName: installer.name,
      scheduledDate: params.scheduledDate,
      timeSlot: params.timeSlot,
    });
    return this.db.saveOrder(order);
  }

  reassignSchedule(params: ReassignScheduleParams): Order {
    const order = this.db.getOrder(params.orderId);
    if (!order) throw new Error(`Order ${params.orderId} not found`);
    if (!order.schedule) throw new Error(`Order ${params.orderId} has no schedule to reassign`);
    const oldInstallerId = order.schedule.installerId;
    const newInstaller = this.db.getUser(params.newInstallerId);
    if (!newInstaller || newInstaller.role !== UserRole.INSTALLER) {
      throw new Error(`Installer ${params.newInstallerId} is invalid`);
    }
    const scheduledDate = params.scheduledDate || order.schedule.scheduledDate;
    const timeSlot = (params.timeSlot || order.schedule.timeSlot) as TimeSlot;
    if (!this.validateInstallerAvailability(params.newInstallerId, scheduledDate, timeSlot)) {
      throw new Error(`Installer ${params.newInstallerId} is not available on ${scheduledDate} ${timeSlot}`);
    }
    order.schedule.installerId = params.newInstallerId;
    order.schedule.assignedBy = params.reassignedBy;
    order.schedule.scheduledDate = scheduledDate;
    order.schedule.timeSlot = timeSlot;
    if (params.estimatedDurationHours !== undefined) {
      order.schedule.estimatedDurationHours = params.estimatedDurationHours;
    }
    order.schedule.updatedAt = new Date().toISOString();
    this.auditService.appendLog(order, AuditAction.SCHEDULE_REASSIGN, params.reassignedBy, {
      scheduleId: order.schedule.id,
      oldInstallerId,
      newInstallerId: params.newInstallerId,
      newInstallerName: newInstaller.name,
      scheduledDate,
      timeSlot,
      reason: params.reason,
    });
    return this.db.saveOrder(order);
  }

  validateInstallerAvailability(installerId: string, date: string, timeSlot: TimeSlot): boolean {
    const orders = this.db.getOrdersByInstaller(installerId);
    for (const order of orders) {
      if (order.schedule &&
          order.schedule.scheduledDate === date &&
          order.schedule.timeSlot === timeSlot &&
          order.schedule.status !== 'CANCELLED' &&
          order.schedule.status !== 'COMPLETED') {
        return false;
      }
    }
    return true;
  }

  getInstallerSchedule(installerId: string, date: string): (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] {
    const orders = this.db.getOrdersByInstaller(installerId);
    const results: (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] = [];
    for (const order of orders) {
      if (order.schedule && order.schedule.scheduledDate === date) {
        results.push({
          ...order.schedule,
          orderNo: order.orderNo,
          customerName: order.customerSnapshot.name,
          customerAddress: order.customerSnapshot.address,
        });
      }
    }
    return results.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }

  getInstallerScheduleRange(installerId: string, startDate: string, endDate: string): (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] {
    const orders = this.db.getOrdersByInstaller(installerId);
    const results: (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] = [];
    for (const order of orders) {
      if (order.schedule && order.schedule.scheduledDate >= startDate && order.schedule.scheduledDate <= endDate) {
        results.push({
          ...order.schedule,
          orderNo: order.orderNo,
          customerName: order.customerSnapshot.name,
          customerAddress: order.customerSnapshot.address,
        });
      }
    }
    return results.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }

  getSchedulesByQuery(params: ScheduleQueryParams): (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] {
    const orders = this.db.getAllOrders();
    const results: (ScheduleRecord & { orderNo: string; customerName: string; customerAddress: string })[] = [];
    for (const order of orders) {
      if (!order.schedule) continue;
      if (params.installerId && order.schedule.installerId !== params.installerId) continue;
      if (params.startDate && order.schedule.scheduledDate < params.startDate) continue;
      if (params.endDate && order.schedule.scheduledDate > params.endDate) continue;
      if (params.status && order.schedule.status !== params.status) continue;
      results.push({
        ...order.schedule,
        orderNo: order.orderNo,
        customerName: order.customerSnapshot.name,
        customerAddress: order.customerSnapshot.address,
      });
    }
    return results.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }

  getDailyScheduleOverview(date: string): {
    date: string;
    totalOrders: number;
    orders: {
      installerId: string;
      installerName: string;
      timeSlot: TimeSlot;
      orderNo: string;
      customerName: string;
      status: ScheduleRecord['status'];
    }[];
  } {
    const orders = this.db.getAllOrders();
    const dailyOrders: {
      installerId: string;
      installerName: string;
      timeSlot: TimeSlot;
      orderNo: string;
      customerName: string;
      status: ScheduleRecord['status'];
    }[] = [];
    for (const order of orders) {
      if (order.schedule && order.schedule.scheduledDate === date) {
        const installer = this.db.getUser(order.schedule.installerId);
        dailyOrders.push({
          installerId: order.schedule.installerId,
          installerName: installer?.name || '未知',
          timeSlot: order.schedule.timeSlot as TimeSlot,
          orderNo: order.orderNo,
          customerName: order.customerSnapshot.name,
          status: order.schedule.status,
        });
      }
    }
    dailyOrders.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    return { date, totalOrders: dailyOrders.length, orders: dailyOrders };
  }

  getAvailableInstallers(date: string, timeSlot: TimeSlot): { id: string; name: string }[] {
    const installers = this.db.getUsersByRole(UserRole.INSTALLER);
    const available: { id: string; name: string }[] = [];
    for (const installer of installers) {
      if (this.validateInstallerAvailability(installer.id, date, timeSlot)) {
        available.push({ id: installer.id, name: installer.name });
      }
    }
    return available;
  }

  getScheduleHistory(orderId: string): ScheduleRecord {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.schedule) throw new Error(`Order ${orderId} has no schedule`);
    return JSON.parse(JSON.stringify(order.schedule));
  }

  getAvailableTimeSlots(date: string): { timeSlot: TimeSlot; availableInstallers: { id: string; name: string }[] }[] {
    return TIME_SLOTS.map(slot => ({
      timeSlot: slot,
      availableInstallers: this.getAvailableInstallers(date, slot),
    }));
  }
}
