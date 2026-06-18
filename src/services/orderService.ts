import { MockDatabase } from '../mock/database';
import { AuditLogService } from './auditLogService';
import {
  Order,
  OrderStatus,
  UserRole,
  TodoItem,
  ResponsibilityInfo,
  MeasureRecord,
  AppointmentRecord,
  ReturnRecord,
  ReturnReason,
  SupplementRecord,
  RemarkRecord,
  PaginationParams,
  PaginationResult,
  AuditAction,
  TimeSlot,
} from '../types';

export class OrderService {
  constructor(
    private db: MockDatabase,
    private auditService: AuditLogService
  ) {}

  getOrderById(orderId: string): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return JSON.parse(JSON.stringify(order));
  }

  getOrderByNo(orderNo: string): Order {
    const order = this.db.getOrderByNo(orderNo);
    if (!order) throw new Error(`OrderNo ${orderNo} not found`);
    return JSON.parse(JSON.stringify(order));
  }


  getOrderDetail(orderId: string): Order & { responsibility: ResponsibilityInfo } {
    const order = this.getOrderById(orderId);
    const responsibility = this.getResponsibilityInfo(order);
    return { ...order, responsibility };
  }
  listOrders(params: PaginationParams): PaginationResult<Order> {
    const all = this.db.getAllOrders();
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    return {
      data: JSON.parse(JSON.stringify(all.slice(start, end))),
      total: all.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(all.length / params.pageSize),
    };
  }

  listOrdersByStatus(status: OrderStatus, params: PaginationParams): PaginationResult<Order> {
    const all = this.db.getOrdersByStatus(status);
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    return {
      data: JSON.parse(JSON.stringify(all.slice(start, end))),
      total: all.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(all.length / params.pageSize),
    };
  }

  getTodosForUser(userId: string): TodoItem[] {
    const user = this.db.getUser(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    const todos: TodoItem[] = [];
    const orders = this.db.getAllOrders();
    for (const order of orders) {
      const todo = this.createTodoForOrder(order, user);
      if (todo) todos.push(todo);
    }
    return todos.sort((a, b) => {
      const pw: Record<TodoItem['priority'], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (pw[a.priority] !== pw[b.priority]) return pw[a.priority] - pw[b.priority];
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private createTodoForOrder(order: Order, user: { id: string; role: UserRole }): TodoItem | null {
    const base = {
      orderId: order.id,
      orderNo: order.orderNo,
      customerName: order.customerSnapshot.name,
      createdAt: order.updatedAt,
      status: order.status,
      responsibility: this.getResponsibilityInfo(order),
    };
    switch (user.role) {
      case UserRole.MEASURER:
        if (order.status === OrderStatus.CREATED) {
          return {
            id: `TODO-${order.id}-MEASURE`,
            ...base,
            type: 'MEASURE_PENDING',
            title: `待量尺 - ${order.customerSnapshot.address}`,
            description: `${order.productItems.length}件窗帘待量尺，共¥${order.totalAmount}订单`,
            priority: 'HIGH',
          };
        }
        break;
      case UserRole.SALES_GUIDE:
        if (order.salesGuideId === user.id) {
          if (order.status === OrderStatus.MEASURED || order.status === OrderStatus.APPOINTMENT_PENDING) {
            return {
              id: `TODO-${order.id}-APPOINTMENT`,
              ...base,
              type: 'APPOINTMENT_PENDING',
              title: '待预约安装',
              description: order.measureRecord ? '量尺已完成，请尽快联系客户预约安装时间' : '待预约安装',
              priority: 'MEDIUM',
            };
          }
          if (order.status === OrderStatus.RETURNED) {
            return {
              id: `TODO-${order.id}-RETURN`,
              ...base,
              type: 'RETURN_PENDING',
              title: '安装退回待处理',
              description: order.returnRecord ? `退回原因：${this.translateReturnReason(order.returnRecord.reason)}` : '安装退回待处理',
              priority: 'HIGH',
              dueAt: new Date(Date.now() + 86400000).toISOString(),
            };
          }
          if (order.status === OrderStatus.MATERIALS_NEEDED) {
            const pending = order.supplementRecords.filter(s => !s.receivedAt);
            if (pending.length > 0) {
              return {
                id: `TODO-${order.id}-SUPPLEMENT`,
                ...base,
                type: 'SUPPLEMENT_PENDING',
                title: `待补充材料 - ${pending.length}项`,
                description: `${pending.length}项材料待补充确认`,
                priority: 'HIGH',
              };
            }
          }
          if (order.status === OrderStatus.COMPLETED) {
            return {
              id: `TODO-${order.id}-ARCHIVE`,
              ...base,
              type: 'ARCHIVE_PENDING',
              title: '待归档',
              description: '安装完成，请确认归档',
              priority: 'LOW',
            };
          }
        }
        break;
      case UserRole.STORE_MANAGER:
        if (order.status === OrderStatus.APPOINTED) {
          return {
            id: `TODO-${order.id}-SCHEDULE`,
            ...base,
            type: 'SCHEDULE_PENDING',
            title: '待分配师傅排班',
            description: order.appointment ? `客户预约${order.appointment.preferredDate} ${order.appointment.preferredTimeSlot}` : '待分配师傅',
            priority: 'MEDIUM',
          };
        }
        if (order.status === OrderStatus.REMINDED) {
          return {
            id: `TODO-${order.id}-REMIND`,
            ...base,
            type: 'REMIND_PENDING',
            title: '客户催单 - 需加急处理',
            description: order.remarkRecords.length > 0 ? order.remarkRecords[order.remarkRecords.length - 1].content : '客户催促安装进度',
            priority: 'HIGH',
            dueAt: new Date(Date.now() + 14400000).toISOString(),
          };
        }
        if (order.status === OrderStatus.RETURNED) {
          return {
            id: `TODO-${order.id}-RETURN-MGR`,
            ...base,
            type: 'RETURN_PENDING',
            title: '安装退回待处理',
            description: order.returnRecord ? `退回原因：${this.translateReturnReason(order.returnRecord.reason)}` : '安装退回待处理',
            priority: 'HIGH',
          };
        }
        if (order.status === OrderStatus.MATERIALS_NEEDED) {
          const pending = order.supplementRecords.filter(s => !s.fulfilledAt);
          if (pending.length > 0) {
            return {
              id: `TODO-${order.id}-SUPPLY`,
              ...base,
              type: 'SUPPLEMENT_PENDING',
              title: `待备货 - ${pending.length}项材料`,
              description: `需安排补货${pending.length}项材料`,
              priority: 'HIGH',
            };
          }
        }
        break;
      case UserRole.INSTALLER:
        if (order.schedule?.installerId === user.id) {
          if (order.status === OrderStatus.INSTALLATION_SCHEDULED || order.status === OrderStatus.REMINDED) {
            return {
              id: `TODO-${order.id}-INSTALL`,
              ...base,
              type: 'INSTALLATION_PENDING',
              title: `待安装 - ${order.customerSnapshot.address}`,
              description: order.schedule ? `排班：${order.schedule.scheduledDate} ${order.schedule.timeSlot}，预计${order.schedule.estimatedDurationHours}小时` : '待安装',
              priority: order.status === OrderStatus.REMINDED ? 'HIGH' : 'MEDIUM',
              dueAt: order.schedule.scheduledDate,
            };
          }
          if (order.status === OrderStatus.MATERIALS_NEEDED) {
            const pending = order.supplementRecords.filter(s => s.fulfilledAt && !s.receivedAt);
            if (pending.length > 0) {
              return {
                id: `TODO-${order.id}-RECEIVE`,
                ...base,
                type: 'SUPPLEMENT_PENDING',
                title: `待收取材料`,
                description: `${pending.length}项补充材料待确认收货`,
                priority: 'HIGH',
              };
            }
          }
        }
        break;
    }
    return null;
  }

  private translateReturnReason(reason: ReturnReason): string {
    const map: Record<ReturnReason, string> = {
      [ReturnReason.WRONG_SIZE]: '尺寸错误',
      [ReturnReason.MATERIAL_DEFECT]: '材料质量问题',
      [ReturnReason.WRONG_COLOR]: '颜色错误',
      [ReturnReason.STYLE_MISMATCH]: '款式不符',
      [ReturnReason.MISSING_ACCESSORIES]: '配件缺失',
      [ReturnReason.CUSTOMER_UNSATISFIED]: '客户不满意',
      [ReturnReason.OTHER]: '其他原因',
    };
    return map[reason] || '未知原因';
  }


  private getResponsibilityInfo(order: Order): ResponsibilityInfo {
    const salesGuideName = this.db.getUser(order.salesGuideId)?.name || '未知';
    const installerName = order.schedule?.installerId
      ? this.db.getUser(order.schedule.installerId)?.name || '未知'
      : '未分配';
    const measurerName = order.measureRecord?.measurerId
      ? this.db.getUser(order.measureRecord.measurerId)?.name || '未知'
      : '未量尺';

    switch (order.status) {
      case OrderStatus.CREATED:
        return {
          stage: 'MEASURE',
          currentRole: UserRole.MEASURER,
          currentUserId: '',
          currentUserName: '待分配量尺师',
          previousNode: '导购' + salesGuideName + '创建订单',
          nextAction: '安排量尺师上门量尺',
        };

      case OrderStatus.MEASURED:
      case OrderStatus.APPOINTMENT_PENDING:
        return {
          stage: 'APPOINTMENT',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '量尺师' + measurerName + '完成量尺',
          nextAction: '联系客户确认安装时间',
        };

      case OrderStatus.APPOINTED:
        return {
          stage: 'SCHEDULE',
          currentRole: UserRole.STORE_MANAGER,
          currentUserId: '',
          currentUserName: '待店长排班',
          previousNode: '导购' + salesGuideName + '创建预约',
          nextAction: '分配安装师傅排班',
        };

      case OrderStatus.INSTALLATION_SCHEDULED:
        return {
          stage: 'INSTALLATION',
          currentRole: UserRole.INSTALLER,
          currentUserId: order.schedule?.installerId || '',
          currentUserName: installerName,
          previousNode: '店长分配' + installerName + '师傅',
          nextAction: '按预约时间上门安装',
        };

      case OrderStatus.REMINDED:
        return {
          stage: 'INSTALLATION',
          currentRole: UserRole.INSTALLER,
          currentUserId: order.schedule?.installerId || '',
          currentUserName: installerName,
          previousNode: '客户催单，店长加急',
          nextAction: '尽快上门安装',
        };

      case OrderStatus.INSTALLING:
        return {
          stage: 'INSTALLATION',
          currentRole: UserRole.INSTALLER,
          currentUserId: order.schedule?.installerId || '',
          currentUserName: installerName,
          previousNode: installerName + '师傅开始安装',
          nextAction: '完成安装并确认验收',
        };

      case OrderStatus.RETURNED:
        return {
          stage: 'RETURN',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '安装师傅' + installerName + '退回(原因:' + (order.returnRecord?.reason || '未知') + ')',
          nextAction: '处理退回并安排补料或重新量尺',
        };

      case OrderStatus.MATERIALS_NEEDED: {
        const pendingFulfill = order.supplementRecords.filter(s => !s.fulfilledAt);
        const pendingReceive = order.supplementRecords.filter(s => s.fulfilledAt && !s.receivedAt);
        if (pendingFulfill.length > 0) {
          return {
            stage: 'MATERIALS',
            currentRole: UserRole.STORE_MANAGER,
            currentUserId: '',
            currentUserName: '待店长备货',
            previousNode: '导购申请补料',
            nextAction: '安排备货并发货',
          };
        } else if (pendingReceive.length > 0) {
          return {
            stage: 'MATERIALS',
            currentRole: UserRole.INSTALLER,
            currentUserId: order.schedule?.installerId || '',
            currentUserName: installerName,
            previousNode: '补料已发货',
            nextAction: '收取补充材料并确认',
          };
        }
        return {
          stage: 'MATERIALS',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '补料已完成',
          nextAction: '确认补料完成',
        };
      }

      case OrderStatus.COMPLETED:
        return {
          stage: 'COMPLETED',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '安装师傅' + installerName + '完成安装',
          nextAction: '确认完工并归档订单',
        };

      case OrderStatus.ARCHIVED:
        return {
          stage: 'ARCHIVED',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '订单已归档',
          nextAction: '无',
        };

      default:
        return {
          stage: 'MEASURE',
          currentRole: UserRole.SALES_GUIDE,
          currentUserId: order.salesGuideId,
          currentUserName: salesGuideName,
          previousNode: '订单处理中',
          nextAction: '等待下一步操作',
        };
    }
  }


  submitMeasureRecord(orderId: string, data: { measurerId: string; windows: MeasureRecord['windows']; notes?: string; images?: string[] }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.CREATED) throw new Error(`Order ${orderId} status is not CREATED`);
    const record: MeasureRecord = {
      id: this.db.generateId('M'),
      orderId,
      measurerId: data.measurerId,
      measuredAt: new Date().toISOString(),
      windows: data.windows,
      notes: data.notes,
      images: data.images,
    };
    order.measureRecord = record;
    order.status = OrderStatus.MEASURED;
    this.auditService.appendLog(order, AuditAction.ORDER_MEASURE, data.measurerId, { measureId: record.id, windows: data.windows.length, notes: data.notes || '' });
    return this.db.saveOrder(order);
  }

  createAppointment(orderId: string, data: { createdBy: string; preferredDate: string; preferredTimeSlot: TimeSlot; backupDate?: string; backupTimeSlot?: TimeSlot; notes?: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (![OrderStatus.MEASURED, OrderStatus.APPOINTMENT_PENDING].includes(order.status)) throw new Error(`Order ${orderId} cannot create appointment`);
    const appointment: AppointmentRecord = {
      id: this.db.generateId('A'),
      orderId,
      createdBy: data.createdBy,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      backupDate: data.backupDate,
      backupTimeSlot: data.backupTimeSlot,
      notes: data.notes,
      customerConfirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    order.appointment = appointment;
    order.status = OrderStatus.APPOINTED;
    this.auditService.appendLog(order, AuditAction.APPOINTMENT_CREATE, data.createdBy, { appointmentId: appointment.id, date: data.preferredDate, timeSlot: data.preferredTimeSlot });
    return this.db.saveOrder(order);
  }

  updateAppointment(orderId: string, data: { updatedBy: string; preferredDate?: string; preferredTimeSlot?: TimeSlot; backupDate?: string; backupTimeSlot?: TimeSlot; notes?: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.appointment) throw new Error(`Order ${orderId} has no appointment`);
    const oldData = { ...order.appointment };
    if (data.preferredDate !== undefined) order.appointment.preferredDate = data.preferredDate;
    if (data.preferredTimeSlot !== undefined) order.appointment.preferredTimeSlot = data.preferredTimeSlot;
    if (data.backupDate !== undefined) order.appointment.backupDate = data.backupDate;
    if (data.backupTimeSlot !== undefined) order.appointment.backupTimeSlot = data.backupTimeSlot;
    if (data.notes !== undefined) order.appointment.notes = data.notes;
    order.appointment.updatedAt = new Date().toISOString();
    if (order.status === OrderStatus.APPOINTMENT_PENDING) order.status = OrderStatus.APPOINTED;
    this.auditService.appendLog(order, AuditAction.APPOINTMENT_UPDATE, data.updatedBy, { appointmentId: order.appointment.id, old: oldData, new: order.appointment });
    return this.db.saveOrder(order);
  }

  startInstallation(orderId: string, installerId: string): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.schedule) throw new Error(`Order ${orderId} has no schedule`);
    if (order.schedule.installerId !== installerId) throw new Error(`Installer ${installerId} is not assigned`);
    if (![OrderStatus.INSTALLATION_SCHEDULED, OrderStatus.REMINDED, OrderStatus.MATERIALS_NEEDED].includes(order.status)) throw new Error(`Cannot start in status ${order.status}`);
    order.schedule.status = 'IN_PROGRESS';
    order.schedule.actualStartTime = new Date().toISOString();
    order.status = OrderStatus.INSTALLING;
    this.auditService.appendLog(order, AuditAction.INSTALLATION_START, installerId, { scheduleId: order.schedule.id, startTime: order.schedule.actualStartTime });
    return this.db.saveOrder(order);
  }

  returnInstallation(orderId: string, data: { returnedBy: string; reason: ReturnReason; detailedReason: string; images?: string[] }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.INSTALLING) throw new Error(`Can only return during INSTALLING`);
    const returnRecord: ReturnRecord = {
      id: this.db.generateId('R'),
      orderId,
      returnedBy: data.returnedBy,
      reason: data.reason,
      detailedReason: data.detailedReason,
      images: data.images,
      createdAt: new Date().toISOString(),
    };
    order.returnRecord = returnRecord;
    order.status = OrderStatus.RETURNED;
    if (order.schedule) { order.schedule.status = 'CANCELLED'; order.schedule.actualEndTime = new Date().toISOString(); }
    this.auditService.appendLog(order, AuditAction.INSTALLATION_RETURN, data.returnedBy, { returnId: returnRecord.id, reason: data.reason, detailedReason: data.detailedReason });
    return this.db.saveOrder(order);
  }

  handleReturn(orderId: string, data: { handledBy: string; handlingNotes: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.RETURNED || !order.returnRecord) throw new Error(`Order ${orderId} is not RETURNED`);
    order.returnRecord.handledBy = data.handledBy;
    order.returnRecord.handlingNotes = data.handlingNotes;
    order.returnRecord.resolvedAt = new Date().toISOString();
    order.status = OrderStatus.MEASURED;
    this.auditService.appendLog(order, AuditAction.RETURN_HANDLE, data.handledBy, { returnId: order.returnRecord.id, handlingNotes: data.handlingNotes });
    return this.db.saveOrder(order);
  }

  requestSupplement(orderId: string, data: { requestedBy: string; items: SupplementRecord['items']; urgency: SupplementRecord['urgency']; notes?: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const supplement: SupplementRecord = {
      id: this.db.generateId('SUP'),
      orderId,
      requestedBy: data.requestedBy,
      items: data.items,
      urgency: data.urgency,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    order.supplementRecords = [...order.supplementRecords, supplement];
    order.status = OrderStatus.MATERIALS_NEEDED;
    this.auditService.appendLog(order, AuditAction.MATERIALS_SUPPLEMENT, data.requestedBy, { supplementId: supplement.id, items: data.items, urgency: data.urgency });
    return this.db.saveOrder(order);
  }

  fulfillSupplement(orderId: string, supplementId: string, data: { fulfilledBy: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const supplement = order.supplementRecords.find(s => s.id === supplementId);
    if (!supplement) throw new Error(`Supplement ${supplementId} not found`);
    if (supplement.fulfilledAt) throw new Error(`Supplement ${supplementId} already fulfilled`);
    supplement.fulfilledBy = data.fulfilledBy;
    supplement.fulfilledAt = new Date().toISOString();
    this.auditService.appendLog(order, AuditAction.MATERIALS_FULFILL, data.fulfilledBy, { supplementId, fulfilledAt: supplement.fulfilledAt });
    return this.db.saveOrder(order);
  }

  receiveSupplement(orderId: string, supplementId: string, data: { receivedBy: string }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const supplement = order.supplementRecords.find(s => s.id === supplementId);
    if (!supplement) throw new Error(`Supplement ${supplementId} not found`);
    if (!supplement.fulfilledAt) throw new Error(`Supplement ${supplementId} not fulfilled yet`);
    if (supplement.receivedAt) throw new Error(`Supplement ${supplementId} already received`);
    supplement.receivedBy = data.receivedBy;
    supplement.receivedAt = new Date().toISOString();
    const allReceived = order.supplementRecords.every(s => s.receivedAt);
    if (allReceived) { order.status = order.returnRecord ? OrderStatus.MEASURED : OrderStatus.INSTALLATION_SCHEDULED; }
    this.auditService.appendLog(order, AuditAction.MATERIALS_RECEIVED, data.receivedBy, { supplementId, receivedAt: supplement.receivedAt });
    return this.db.saveOrder(order);
  }

  completeInstallation(orderId: string, installerId: string): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.schedule) throw new Error(`Order ${orderId} has no schedule`);
    if (order.schedule.installerId !== installerId) throw new Error(`Installer ${installerId} is not assigned`);
    if (order.status !== OrderStatus.INSTALLING) throw new Error(`Can only complete during INSTALLING`);
    order.schedule.status = 'COMPLETED';
    order.schedule.actualEndTime = new Date().toISOString();
    order.status = OrderStatus.COMPLETED;
    this.auditService.appendLog(order, AuditAction.INSTALLATION_COMPLETE, installerId, { scheduleId: order.schedule.id, endTime: order.schedule.actualEndTime });
    return this.db.saveOrder(order);
  }

  archiveOrder(orderId: string, operatorId: string): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.COMPLETED) throw new Error(`Can only archive COMPLETED orders`);
    order.status = OrderStatus.ARCHIVED;
    order.archivedAt = new Date().toISOString();
    this.auditService.appendLog(order, AuditAction.ORDER_ARCHIVE, operatorId, { archivedAt: order.archivedAt });
    return this.db.saveOrder(order);
  }

  addRemark(orderId: string, data: { createdBy: string; content: string; attachments?: string[] }): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const remark: RemarkRecord = {
      id: this.db.generateId('REM'),
      orderId,
      createdBy: data.createdBy,
      content: data.content,
      attachments: data.attachments,
      createdAt: new Date().toISOString(),
    };
    order.remarkRecords = [...order.remarkRecords, remark];
    this.auditService.appendLog(order, AuditAction.REMARK_ADD, data.createdBy, { remarkId: remark.id, content: data.content });
    return this.db.saveOrder(order);
  }

  remindOrder(orderId: string, operatorId: string, reason: string): Order {
    const order = this.db.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const previousStatus = order.status;
    order.status = OrderStatus.REMINDED;
    this.auditService.appendLog(order, AuditAction.INSTALLATION_REMIND, operatorId, { reason, previousStatus });
    return this.db.saveOrder(order);
  }
}
