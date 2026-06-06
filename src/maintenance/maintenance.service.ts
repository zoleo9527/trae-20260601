import { Injectable, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../common/data-store.service';
import { RepairService } from '../repair/repair.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { User } from '../common/interfaces/user.interface';
import { HistoryNote } from '../common/interfaces/history-note.interface';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly dataStore: DataStoreService,
    private readonly repairService: RepairService,
    private readonly dispatchService: DispatchService,
  ) {}

  async acceptOrder(repairOrderId: string, operator: User, note?: string): Promise<void> {
    const repairOrder = await this.repairService.findOne(repairOrderId);
    
    if (repairOrder.status !== 'dispatched') {
      throw new BadRequestException('该报修单状态不正确，无法接单');
    }

    if (repairOrder.assignedWorkerId !== operator.id) {
      throw new BadRequestException('该工单不是派给您的');
    }

    const dispatches = await this.dispatchService.findByRepairOrder(repairOrderId);
    const latestDispatch = dispatches[0];
    if (latestDispatch) {
      this.dispatchService.updateStatus(latestDispatch.id, 'accepted', note);
    }

    this.repairService.updateStatus(
      repairOrderId,
      'accepted',
      operator,
      `已接单${note ? `，备注：${note}` : ''}`,
    );
  }

  async startProcessing(repairOrderId: string, operator: User, note?: string): Promise<void> {
    const repairOrder = await this.repairService.findOne(repairOrderId);
    
    if (repairOrder.status !== 'accepted') {
      throw new BadRequestException('该报修单状态不正确，无法开始处理');
    }

    if (repairOrder.assignedWorkerId !== operator.id) {
      throw new BadRequestException('该工单不是派给您的');
    }

    this.repairService.updateStatus(
      repairOrderId,
      'in_progress',
      operator,
      `开始维修${note ? `，备注：${note}` : ''}`,
    );
  }

  async completeOrder(repairOrderId: string, operator: User, note?: string): Promise<void> {
    const repairOrder = await this.repairService.findOne(repairOrderId);
    
    if (repairOrder.status !== 'in_progress' && repairOrder.status !== 'accepted') {
      throw new BadRequestException('该报修单状态不正确，无法完成');
    }

    if (repairOrder.assignedWorkerId !== operator.id) {
      throw new BadRequestException('该工单不是派给您的');
    }

    const dispatches = await this.dispatchService.findByRepairOrder(repairOrderId);
    const latestDispatch = dispatches[0];
    if (latestDispatch) {
      this.dispatchService.updateStatus(latestDispatch.id, 'accepted', note);
    }

    this.repairService.updateStatus(
      repairOrderId,
      'completed',
      operator,
      `维修完成${note ? `，备注：${note}` : ''}`,
    );
  }

  async getMyOrders(workerId: string): Promise<any[]> {
    const dispatches = await this.dispatchService.findAll({ workerId });
    const repairOrderIds = [...new Set(dispatches.map(d => d.repairOrderId))];
    
    const orders = [];
    for (const orderId of repairOrderIds) {
      try {
        const order = await this.repairService.findOne(orderId);
        const orderDispatches = dispatches.filter(d => d.repairOrderId === orderId);
        orders.push({
          ...order,
          latestDispatch: orderDispatches[0],
        });
      } catch (e) {
        // skip
      }
    }
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addProgressNote(repairOrderId: string, operator: User, content: string): Promise<void> {
    const note: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: repairOrderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'progress_note',
      content: `进度备注：${content}`,
      timestamp: new Date(),
    };
    this.repairService.addHistoryNote(repairOrderId, note);
  }

  async reportException(repairOrderId: string, operator: User, exceptionType: string, content: string): Promise<void> {
    const note: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: repairOrderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'report_exception',
      content: `异常上报[${exceptionType}]：${content}`,
      timestamp: new Date(),
      isException: true,
      exceptionType,
    };
    this.repairService.addHistoryNote(repairOrderId, note);
  }
}
