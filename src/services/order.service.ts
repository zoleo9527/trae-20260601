import {
  RepairStatus,
  Role,
  RepairOrder,
  RepairOrderDetail,
  RepairMaterial,
  RepairFee,
  StatusHistory,
  AuditRecord,
  AuditResult,
} from '../types';
import { db as defaultDb, Database } from '../db/database';
import { BusinessError, ErrorCode } from '../common/errorCode';
import { generateOrderNo } from '../common/utils';

export interface CreateOrderInput {
  dormitory: string;
  roomNumber: string;
  issueType: string;
  description: string;
  creatorId: string;
}

export interface AssignOrderInput {
  orderId: string;
  assigneeId: string;
  operatorId: string;
  remark?: string;
}

export interface RegisterMaterialInput {
  orderId: string;
  materials: Array<{
    materialName: string;
    specification?: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    note?: string;
  }>;
  operatorId: string;
}

export interface RegisterFeeInput {
  orderId: string;
  fees: Array<{
    feeType: string;
    amount: number;
    note?: string;
  }>;
  operatorId: string;
}

export interface AuditOrderInput {
  orderId: string;
  auditorId: string;
  auditResult: 'APPROVED' | 'REJECTED';
  auditOpinion?: string;
  returnReason?: string;
}

export interface SupplementNoteInput {
  orderId: string;
  note: string;
  operatorId: string;
}

export class OrderService {
  private db: Database;

  constructor(db?: Database) {
    this.db = db || defaultDb;
  }

  async createOrder(input: CreateOrderInput): Promise<RepairOrderDetail> {
    const { dormitory, roomNumber, issueType, description, creatorId } = input;

    const creator = this.db.users.find(u => u.id === creatorId);
    if (!creator) {
      throw new BusinessError(ErrorCode.USER_NOT_FOUND);
    }

    const orderNo = generateOrderNo();
    const now = this.db.now();

    const order: RepairOrder = {
      id: this.db.generateId(),
      orderNo,
      dormitory,
      roomNumber,
      issueType,
      description,
      currentStatus: RepairStatus.CREATED,
      creatorId,
      createdAt: now,
      updatedAt: now,
    };

    this.db.orders.push(order);

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId: order.id,
      toStatus: RepairStatus.CREATED,
      operatorId: creatorId,
      operatedAt: now,
      remark: '创建维修工单',
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(order.id);
  }

  async assignOrder(input: AssignOrderInput): Promise<RepairOrderDetail> {
    const { orderId, assigneeId, operatorId, remark } = input;

    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    if (order.currentStatus !== RepairStatus.CREATED) {
      throw new BusinessError(ErrorCode.OPERATION_NOT_ALLOWED, '只有待派单状态可以派单');
    }

    const assignee = this.db.users.find(u => u.id === assigneeId);
    if (!assignee || assignee.role !== Role.REPAIR_WORKER) {
      throw new BusinessError(ErrorCode.USER_ROLE_INVALID, '被指派人必须是维修师傅');
    }

    const operator = this.db.users.find(u => u.id === operatorId);
    if (!operator || operator.role !== Role.LOGISTICS_SUPERVISOR) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有后勤主管可以派单');
    }

    const now = this.db.now();
    const fromStatus = order.currentStatus;

    order.assigneeId = assigneeId;
    order.currentStatus = RepairStatus.ASSIGNED;
    order.updatedAt = now;

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId,
      fromStatus,
      toStatus: RepairStatus.ASSIGNED,
      operatorId,
      operatedAt: now,
      remark: remark || `派单给维修师傅: ${assignee.name}`,
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(orderId);
  }

  async registerMaterials(input: RegisterMaterialInput): Promise<RepairOrderDetail> {
    const { orderId, materials, operatorId } = input;

    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    if (![RepairStatus.ASSIGNED, RepairStatus.RETURNED].includes(order.currentStatus)) {
      throw new BusinessError(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许登记材料');
    }

    const operator = this.db.users.find(u => u.id === operatorId);
    if (!operator || operator.role !== Role.REPAIR_WORKER) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有维修师傅可以登记材料');
    }

    if (order.assigneeId !== operatorId) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有被指派的维修师傅可以登记材料');
    }

    const now = this.db.now();
    const fromStatus = order.currentStatus;

    const filteredMaterials = this.db.materials.filter(m => m.orderId !== orderId);
    this.db.setMaterials(filteredMaterials);

    for (const mat of materials) {
      const material: RepairMaterial = {
        id: this.db.generateId(),
        orderId,
        materialName: mat.materialName,
        specification: mat.specification,
        quantity: mat.quantity,
        unit: mat.unit,
        unitPrice: mat.unitPrice,
        registeredBy: operatorId,
        registeredAt: now,
        note: mat.note,
      };
      this.db.materials.push(material);
    }

    order.currentStatus = RepairStatus.MATERIAL_REGISTERED;
    order.updatedAt = now;

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId,
      fromStatus,
      toStatus: RepairStatus.MATERIAL_REGISTERED,
      operatorId,
      operatedAt: now,
      remark: '登记维修材料',
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(orderId);
  }

  async registerFees(input: RegisterFeeInput): Promise<RepairOrderDetail> {
    const { orderId, fees, operatorId } = input;

    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    if (order.currentStatus !== RepairStatus.MATERIAL_REGISTERED) {
      throw new BusinessError(ErrorCode.OPERATION_NOT_ALLOWED, '只有材料已登记状态可以登记费用');
    }

    const operator = this.db.users.find(u => u.id === operatorId);
    if (!operator || operator.role !== Role.REPAIR_WORKER) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有维修师傅可以登记费用');
    }

    if (order.assigneeId !== operatorId) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有被指派的维修师傅可以登记费用');
    }

    const now = this.db.now();
    const fromStatus = order.currentStatus;

    const filteredFees = this.db.fees.filter(f => f.orderId !== orderId);
    this.db.setFees(filteredFees);

    for (const fee of fees) {
      const repairFee: RepairFee = {
        id: this.db.generateId(),
        orderId,
        feeType: fee.feeType,
        amount: fee.amount,
        registeredBy: operatorId,
        registeredAt: now,
        note: fee.note,
      };
      this.db.fees.push(repairFee);
    }

    order.currentStatus = RepairStatus.FEE_REGISTERED;
    order.updatedAt = now;

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId,
      fromStatus,
      toStatus: RepairStatus.FEE_REGISTERED,
      operatorId,
      operatedAt: now,
      remark: '登记维修费用',
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(orderId);
  }

  async auditOrder(input: AuditOrderInput): Promise<RepairOrderDetail> {
    const { orderId, auditorId, auditResult, auditOpinion, returnReason } = input;

    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    if (order.currentStatus !== RepairStatus.FEE_REGISTERED) {
      throw new BusinessError(ErrorCode.OPERATION_NOT_ALLOWED, '只有费用已登记状态可以审核');
    }

    const auditor = this.db.users.find(u => u.id === auditorId);
    if (!auditor || auditor.role !== Role.LOGISTICS_SUPERVISOR) {
      throw new BusinessError(ErrorCode.PERMISSION_DENIED, '只有后勤主管可以审核');
    }

    const now = this.db.now();
    const fromStatus = order.currentStatus;
    const targetStatus = auditResult === 'APPROVED' 
      ? RepairStatus.COMPLETED 
      : RepairStatus.RETURNED;

    order.currentStatus = targetStatus;
    if (auditResult === 'REJECTED') {
      order.returnReason = returnReason;
    }
    order.updatedAt = now;

    const auditRecord: AuditRecord = {
      id: this.db.generateId(),
      orderId,
      auditorId,
      auditResult: auditResult as AuditResult,
      auditAt: now,
      auditOpinion,
      returnReason: auditResult === 'REJECTED' ? returnReason : undefined,
    };
    this.db.auditRecords.push(auditRecord);

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId,
      fromStatus,
      toStatus: targetStatus,
      operatorId: auditorId,
      operatedAt: now,
      remark: auditResult === 'APPROVED' 
        ? `审核通过: ${auditOpinion || ''}` 
        : `审核退回: ${returnReason || ''}`,
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(orderId);
  }

  async supplementNote(input: SupplementNoteInput): Promise<RepairOrderDetail> {
    const { orderId, note, operatorId } = input;

    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    const now = this.db.now();

    order.supplementNote = note;
    order.updatedAt = now;

    const statusHistory: StatusHistory = {
      id: this.db.generateId(),
      orderId,
      fromStatus: order.currentStatus,
      toStatus: order.currentStatus,
      operatorId,
      operatedAt: now,
      remark: `补充备注: ${note}`,
    };
    this.db.statusHistories.push(statusHistory);

    this.db.save();
    return this.getOrderDetail(orderId);
  }

  async getOrderDetail(orderId: string): Promise<RepairOrderDetail> {
    const order = this.db.orders.find(o => o.id === orderId);
    if (!order) {
      throw new BusinessError(ErrorCode.ORDER_NOT_FOUND);
    }

    const creator = this.db.users.find(u => u.id === order.creatorId)!;
    const assignee = order.assigneeId 
      ? this.db.users.find(u => u.id === order.assigneeId) 
      : undefined;

    const materials = this.db.materials.filter(m => m.orderId === orderId);
    const fees = this.db.fees.filter(f => f.orderId === orderId);

    const statusHistories = this.db.statusHistories
      .filter(s => s.orderId === orderId)
      .sort((a, b) => a.operatedAt.getTime() - b.operatedAt.getTime())
      .map(s => ({
        ...s,
        operator: this.db.users.find(u => u.id === s.operatorId)!,
      }));

    const auditRecords = this.db.auditRecords
      .filter(a => a.orderId === orderId)
      .sort((a, b) => b.auditAt.getTime() - a.auditAt.getTime())
      .map(a => ({
        ...a,
        auditor: this.db.users.find(u => u.id === a.auditorId)!,
      }));

    return {
      ...order,
      creator,
      assignee,
      materials,
      fees,
      statusHistories,
      auditRecords,
    };
  }

  async getTodoList(userId: string, role: string) {
    switch (role) {
      case Role.DORM_MANAGER:
        return this.getDormManagerTodoList(userId);
      case Role.REPAIR_WORKER:
        return this.getRepairWorkerTodoList(userId);
      case Role.LOGISTICS_SUPERVISOR:
        return this.getLogisticsSupervisorTodoList();
      default:
        return [];
    }
  }

  private async getDormManagerTodoList(userId: string) {
    const orders = this.db.orders.filter(o => o.creatorId === userId);
    return this.enhanceOrderList(orders);
  }

  private async getRepairWorkerTodoList(userId: string) {
    const orders = this.db.orders.filter(o => 
      o.assigneeId === userId && 
      [RepairStatus.ASSIGNED, RepairStatus.MATERIAL_REGISTERED, RepairStatus.RETURNED].includes(o.currentStatus)
    );

    return this.enhanceOrderList(orders);
  }

  private async getLogisticsSupervisorTodoList() {
    const orders = this.db.orders.filter(o => 
      [RepairStatus.CREATED, RepairStatus.FEE_REGISTERED].includes(o.currentStatus)
    );

    return this.enhanceOrderList(orders);
  }

  private enhanceOrderList(orders: RepairOrder[]) {
    return orders
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(o => {
        const creator = this.db.users.find(u => u.id === o.creatorId);
        const assignee = o.assigneeId ? this.db.users.find(u => u.id === o.assigneeId) : undefined;
        const materials = this.db.materials.filter(m => m.orderId === o.id);
        const fees = this.db.fees.filter(f => f.orderId === o.id);

        return {
          ...o,
          creator: creator ? { id: creator.id, name: creator.name } : undefined,
          assignee: assignee ? { id: assignee.id, name: assignee.name } : undefined,
          materials,
          fees,
        };
      });
  }

  async getAllOrders(params?: { status?: string; startDate?: string; endDate?: string }) {
    let orders = [...this.db.orders];
    
    if (params?.status) {
      orders = orders.filter(o => o.currentStatus === params.status);
    }
    
    if (params?.startDate && params?.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate + ' 23:59:59');
      orders = orders.filter(o => o.createdAt >= start && o.createdAt <= end);
    }

    return this.enhanceOrderList(orders).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const orderService = new OrderService();
