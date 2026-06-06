import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../common/data-store.service';
import { DispatchRecord, DispatchStatus } from './interfaces/dispatch.interface';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { RepairService } from '../repair/repair.service';
import { HistoryNote } from '../common/interfaces/history-note.interface';
import { User } from '../common/interfaces/user.interface';

const statusNames: Record<string, string> = {
  pending: '待派单',
  dispatched: '已派单',
  accepted: '已接单',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  reassigned: '已转派',
  rejected: '已拒绝',
};

@Injectable()
export class DispatchService {
  constructor(
    private readonly dataStore: DataStoreService,
    private readonly repairService: RepairService,
  ) {}

  async create(createDto: CreateDispatchDto, operator: User): Promise<DispatchRecord> {
    const repairOrder = await this.repairService.findOne(createDto.repairOrderId);
    
    if (repairOrder.status !== 'pending') {
      throw new BadRequestException('该报修单已派单，无法重复派单');
    }

    const records = this.dataStore.getDispatchRecords();
    
    const record: DispatchRecord = {
      id: `dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      repairOrderId: createDto.repairOrderId,
      repairOrderNo: repairOrder.orderNo,
      repairTitle: repairOrder.title,
      dispatcherId: createDto.dispatcherId,
      dispatcherName: createDto.dispatcherName,
      workerId: createDto.workerId,
      workerName: createDto.workerName,
      status: 'dispatched',
      dispatchNote: createDto.dispatchNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    records.push(record);
    this.dataStore.setDispatchRecords(records);

    this.repairService.updateStatus(
      createDto.repairOrderId,
      'dispatched',
      operator,
      `派单给 ${createDto.workerName}${createDto.dispatchNote ? `，备注：${createDto.dispatchNote}` : ''}`,
    );
    this.repairService.assignWorker(createDto.repairOrderId, createDto.workerId, createDto.workerName);

    return record;
  }

  async reassign(dispatchId: string, workerId: string, workerName: string, note: string, operator: User): Promise<DispatchRecord> {
    const records = this.dataStore.getDispatchRecords();
    const index = records.findIndex(r => r.id === dispatchId);
    
    if (index === -1) {
      throw new NotFoundException(`派单记录 ${dispatchId} 不存在`);
    }

    const oldRecord = records[index];

    const allDispatchesForOrder = records
      .filter(r => r.repairOrderId === oldRecord.repairOrderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const latestDispatch = allDispatchesForOrder[0];
    if (latestDispatch.id !== oldRecord.id) {
      throw new BadRequestException('仅允许对最新的派单记录进行转派');
    }

    const completedStatuses = ['completed', 'rejected', 'cancelled'];
    if (completedStatuses.includes(oldRecord.status)) {
      throw new BadRequestException('该派单已完成或终止，无法转派');
    }

    const repairOrder = await this.repairService.findOne(oldRecord.repairOrderId);
    const oldStatus = repairOrder.status;
    const oldWorkerName = oldRecord.workerName;

    const newRecord: DispatchRecord = {
      id: `dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      repairOrderId: oldRecord.repairOrderId,
      repairOrderNo: oldRecord.repairOrderNo,
      repairTitle: oldRecord.repairTitle,
      dispatcherId: operator.id,
      dispatcherName: operator.name,
      workerId,
      workerName,
      status: 'dispatched',
      dispatchNote: note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    oldRecord.status = 'reassigned';
    oldRecord.updatedAt = new Date();
    records[index] = oldRecord;
    records.push(newRecord);
    this.dataStore.setDispatchRecords(records);

    this.repairService.assignWorker(oldRecord.repairOrderId, workerId, workerName);

    this.repairService.updateStatus(
      oldRecord.repairOrderId,
      'dispatched',
      operator,
      `转派后重置状态：从「${statusNames[oldStatus] || oldStatus}」回退为待新师傅接单`,
    );
    
    const historyNote: HistoryNote = {
      id: `note_${Date.now()}`,
      orderId: oldRecord.repairOrderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'reassign',
      content: `转派：从 ${oldWorkerName} 转给 ${workerName}${note ? `，备注：${note}` : ''}`,
      timestamp: new Date(),
    };
    this.repairService.addHistoryNote(oldRecord.repairOrderId, historyNote);

    const statusRollbackNote: HistoryNote = {
      id: `note_${Date.now()}_rollback`,
      orderId: oldRecord.repairOrderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'status_rollback',
      content: `状态回退：报修单状态从「${statusNames[oldStatus] || oldStatus}」重置为「已派单」，等待 ${workerName} 接单`,
      timestamp: new Date(),
    };
    this.repairService.addHistoryNote(oldRecord.repairOrderId, statusRollbackNote);

    const syncNote: HistoryNote = {
      id: `note_${Date.now()}_sync`,
      orderId: oldRecord.repairOrderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'dispatch_sync',
      content: `派单状态同步：原派单(#${oldRecord.id.slice(-6)})标记为已转派，新派单(#${newRecord.id.slice(-6)})已生成待接单`,
      timestamp: new Date(),
    };
    this.repairService.addHistoryNote(oldRecord.repairOrderId, syncNote);

    return newRecord;
  }

  async findAll(filters?: { workerId?: string; status?: DispatchStatus }): Promise<DispatchRecord[]> {
    let records = this.dataStore.getDispatchRecords();
    
    if (filters?.workerId) {
      records = records.filter(r => r.workerId === filters.workerId);
    }
    if (filters?.status) {
      records = records.filter(r => r.status === filters.status);
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findOne(id: string): Promise<DispatchRecord> {
    const records = this.dataStore.getDispatchRecords();
    const record = records.find(r => r.id === id);
    if (!record) {
      throw new NotFoundException(`派单记录 ${id} 不存在`);
    }
    return record;
  }

  async findByRepairOrder(repairOrderId: string): Promise<DispatchRecord[]> {
    const records = this.dataStore.getDispatchRecords();
    return records
      .filter(r => r.repairOrderId === repairOrderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateStatus(id: string, status: DispatchStatus, note?: string): DispatchRecord {
    const records = this.dataStore.getDispatchRecords();
    const index = records.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`派单记录 ${id} 不存在`);
    }

    records[index].status = status;
    if (note) {
      records[index].workerNote = note;
    }
    records[index].updatedAt = new Date();
    this.dataStore.setDispatchRecords(records);

    return records[index];
  }
}
