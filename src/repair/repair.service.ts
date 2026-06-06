import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStoreService } from '../common/data-store.service';
import { RepairOrder, RepairStatus } from './interfaces/repair.interface';
import { CreateRepairDto } from './dto/create-repair.dto';
import { HistoryNote } from '../common/interfaces/history-note.interface';
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class RepairService {
  constructor(private readonly dataStore: DataStoreService) {}

  async create(createDto: CreateRepairDto, operator: User): Promise<RepairOrder> {
    const orders = this.dataStore.getRepairOrders();
    const orderNo = `BX${Date.now().toString().slice(-8)}`;
    
    const order: RepairOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      orderNo,
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      urgency: createDto.urgency,
      location: createDto.location,
      dormitory: createDto.dormitory,
      reporterName: createDto.reporterName,
      reporterPhone: createDto.reporterPhone,
      reporterId: createDto.reporterId,
      status: 'pending',
      hasUnclearResponsibility: createDto.hasUnclearResponsibility || false,
      responsibilityNote: createDto.responsibilityNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.push(order);
    this.dataStore.setRepairOrders(orders);

    const note: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: order.id,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'create',
      content: `提交报修单：${createDto.title}`,
      timestamp: new Date(),
    };
    this.dataStore.addHistoryNote(order.id, note);

    if (createDto.hasUnclearResponsibility) {
      const exceptionNote: HistoryNote = {
        id: `note_${Date.now()}_exc`,
        orderId: order.id,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: 'mark_exception',
        content: `标记责任不清：${createDto.responsibilityNote || '未填写备注'}`,
        timestamp: new Date(),
        isException: true,
        exceptionType: 'responsibility_unclear',
      };
      this.dataStore.addHistoryNote(order.id, exceptionNote);
    }

    return order;
  }

  async findAll(filters?: { status?: RepairStatus; reporterId?: string }): Promise<RepairOrder[]> {
    let orders = this.dataStore.getRepairOrders();
    
    if (filters?.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters?.reporterId) {
      orders = orders.filter(o => o.reporterId === filters.reporterId);
    }

    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findOne(id: string): Promise<RepairOrder> {
    const orders = this.dataStore.getRepairOrders();
    const order = orders.find(o => o.id === id);
    if (!order) {
      throw new NotFoundException(`报修单 ${id} 不存在`);
    }
    return order;
  }

  async markResponsibility(id: string, note: string, operator: User): Promise<RepairOrder> {
    const orders = this.dataStore.getRepairOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new NotFoundException(`报修单 ${id} 不存在`);
    }

    orders[index].hasUnclearResponsibility = true;
    orders[index].responsibilityNote = note;
    orders[index].updatedAt = new Date();
    this.dataStore.setRepairOrders(orders);

    const historyNote: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: id,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'mark_responsibility',
      content: `标记责任不清：${note}`,
      timestamp: new Date(),
      isException: true,
      exceptionType: 'responsibility_unclear',
    };
    this.dataStore.addHistoryNote(id, historyNote);

    return orders[index];
  }

  async getHistory(id: string): Promise<HistoryNote[]> {
    await this.findOne(id);
    return this.dataStore.getHistoryNotes(id).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  updateStatus(id: string, status: RepairStatus, operator: User, actionNote: string): RepairOrder {
    const orders = this.dataStore.getRepairOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new NotFoundException(`报修单 ${id} 不存在`);
    }

    orders[index].status = status;
    orders[index].updatedAt = new Date();
    
    if (status === 'completed') {
      orders[index].completedAt = new Date();
    }
    
    this.dataStore.setRepairOrders(orders);

    const note: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: id,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: `update_status_${status}`,
      content: actionNote,
      timestamp: new Date(),
    };
    this.dataStore.addHistoryNote(id, note);

    return orders[index];
  }

  assignWorker(id: string, workerId: string, workerName: string): void {
    const orders = this.dataStore.getRepairOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].assignedWorkerId = workerId;
      orders[index].assignedWorkerName = workerName;
      orders[index].updatedAt = new Date();
      this.dataStore.setRepairOrders(orders);
    }
  }

  addHistoryNote(id: string, note: HistoryNote): void {
    this.dataStore.addHistoryNote(id, note);
  }
}
