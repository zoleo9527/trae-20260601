import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransferOrder, AuditLogEntry, TransferItem } from './entities/transfer-order.entity';
import { TransferStatus, TransferAction, TransferPriority } from './enums';
import { TransferStateMachine } from './state-machine/transfer.state-machine';
import {
  CreateTransferDto,
  UpdateTransferDto,
  TransferActionDto,
  BatchApproveDto,
  QueryTransferDto,
  BatchApproveResultDto,
  BatchApproveResultItemDto,
} from './dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/error-codes';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { InventoryService } from '../inventory/inventory.service';

export interface Operator {
  id: string;
  name: string;
  role: string;
}

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(TransferOrder)
    private readonly transferRepository: Repository<TransferOrder>,
    private readonly stateMachine: TransferStateMachine,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createDto: CreateTransferDto, operator: Operator): Promise<TransferOrder> {
    const { items, priority, ...rest } = createDto;

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const order = this.transferRepository.create({
      ...rest,
      items: items as TransferItem[],
      totalQuantity,
      totalAmount,
      priority: priority || TransferPriority.MEDIUM,
      currentStatus: TransferStatus.DRAFT,
      auditLogs: [],
      orderNo: this.generateOrderNo(),
    });

    return this.transferRepository.save(order);
  }

  async findAll(query: QueryTransferDto): Promise<PaginatedResult<TransferOrder>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      currentStatus,
      transferType,
      priority,
      fromStoreId,
      toStoreId,
      startTime,
      endTime,
    } = query;

    const where: FindOptionsWhere<TransferOrder> = {};

    if (currentStatus) where.currentStatus = currentStatus;
    if (transferType) where.transferType = transferType;
    if (priority) where.priority = priority;
    if (fromStoreId) where.fromStoreId = fromStoreId;
    if (toStoreId) where.toStoreId = toStoreId;
    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const [items, total] = await this.transferRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [sortBy]: sortOrder },
    });

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<TransferOrder> {
    const order = await this.transferRepository.findOne({ where: { id } });
    if (!order) {
      throw new BusinessException(ErrorCode.TRANSFER_NOT_FOUND, `调拨单不存在: ${id}`);
    }
    return order;
  }

  async update(id: string, updateDto: UpdateTransferDto): Promise<TransferOrder> {
    const order = await this.findOne(id);

    if (order.currentStatus !== TransferStatus.DRAFT) {
      throw new BusinessException(
        ErrorCode.TRANSFER_INVALID_STATE,
        '只有草稿状态的调拨单可以修改',
        { currentStatus: order.currentStatus },
      );
    }

    const { items, ...rest } = updateDto;

    if (items) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      Object.assign(order, {
        ...rest,
        items: items as TransferItem[],
        totalQuantity,
        totalAmount,
      });
    } else {
      Object.assign(order, rest);
    }

    return this.transferRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    if (order.currentStatus !== TransferStatus.DRAFT) {
      throw new BusinessException(
        ErrorCode.TRANSFER_INVALID_STATE,
        '只有草稿状态的调拨单可以删除',
        { currentStatus: order.currentStatus },
      );
    }
    await this.transferRepository.remove(order);
  }

  async submit(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder> {
    return this.performAction(id, TransferAction.SUBMIT, dto, operator);
  }

  async approve(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder> {
    if (operator.role !== 'MANAGER') {
      throw new BusinessException(ErrorCode.TRANSFER_MANAGER_REQUIRED);
    }
    return this.performAction(id, TransferAction.APPROVE, dto, operator);
  }

  async reject(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder> {
    if (operator.role !== 'MANAGER') {
      throw new BusinessException(ErrorCode.TRANSFER_MANAGER_REQUIRED);
    }
    if (!dto.rejectReason) {
      throw new BusinessException(ErrorCode.INVALID_PARAMETER, '拒绝原因不能为空');
    }
    return this.performAction(id, TransferAction.REJECT, dto, operator);
  }

  async complete(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder> {
    const order = await this.findOne(id);
    this.stateMachine.validateTransition(order.currentStatus, TransferAction.COMPLETE, operator.role);

    await this.validateAndUpdateInventory(order);

    return this.performAction(id, TransferAction.COMPLETE, dto, operator);
  }

  async cancel(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder> {
    return this.performAction(id, TransferAction.CANCEL, dto, operator);
  }

  async batchApprove(
    dto: BatchApproveDto,
    operator: Operator,
  ): Promise<BatchApproveResultDto> {
    const { ids, action, remark, rejectReason } = dto;

    if (ids.length === 0) {
      throw new BusinessException(ErrorCode.TRANSFER_BATCH_EMPTY);
    }

    if (operator.role !== 'MANAGER') {
      throw new BusinessException(ErrorCode.TRANSFER_MANAGER_REQUIRED);
    }

    if (action === TransferAction.REJECT && !rejectReason) {
      throw new BusinessException(ErrorCode.INVALID_PARAMETER, '批量拒绝时拒绝原因不能为空');
    }

    const results: BatchApproveResultItemDto[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        await this.performAction(
          id,
          action,
          { remark, rejectReason },
          operator,
        );
        results.push({ id, success: true });
        successCount++;
      } catch (error) {
        const code = error instanceof BusinessException ? error.getCode() : ErrorCode.INTERNAL_ERROR;
        const message = error instanceof Error ? error.message : '未知错误';
        results.push({ id, success: false, code, message });
        failCount++;
      }
    }

    return { successCount, failCount, results };
  }

  async getAllowedActions(id: string, operator: Operator): Promise<TransferAction[]> {
    const order = await this.findOne(id);
    return this.stateMachine.getAllowedActions(order.currentStatus, operator.role);
  }

  async getStatistics(): Promise<Record<TransferStatus, number>> {
    const statuses = Object.values(TransferStatus);
    const result = {} as Record<TransferStatus, number>;

    for (const status of statuses) {
      result[status] = await this.transferRepository.count({ where: { currentStatus: status } });
    }

    return result;
  }

  private async performAction(
    id: string,
    action: TransferAction,
    dto: TransferActionDto,
    operator: Operator,
  ): Promise<TransferOrder> {
    const order = await this.findOne(id);
    const fromStatus = order.currentStatus;

    this.stateMachine.validateTransition(fromStatus, action, operator.role);

    const toStatus = this.stateMachine.getNextState(fromStatus, action);
    const now = new Date();

    const auditLog: AuditLogEntry = {
      action,
      fromStatus,
      toStatus,
      operatorId: operator.id,
      operatorName: operator.name,
      operateTime: now,
      remark: dto.remark,
      rejectReason: dto.rejectReason,
    };

    order.auditLogs = [...order.auditLogs, auditLog];
    order.currentStatus = toStatus;

    switch (action) {
      case TransferAction.SUBMIT:
        order.submitterId = operator.id;
        order.submitterName = operator.name;
        order.submitTime = now;
        break;
      case TransferAction.APPROVE:
        order.approverId = operator.id;
        order.approverName = operator.name;
        order.approveTime = now;
        order.approveRemark = dto.remark;
        break;
      case TransferAction.REJECT:
        order.approverId = operator.id;
        order.approverName = operator.name;
        order.approveTime = now;
        order.rejectReason = dto.rejectReason;
        break;
      case TransferAction.COMPLETE:
        order.completedBy = operator.id;
        order.completedAt = now;
        break;
    }

    return this.transferRepository.save(order);
  }

  private async validateAndUpdateInventory(order: TransferOrder): Promise<void> {
    for (const item of order.items) {
      const sourceInventory = await this.inventoryService.findByMedicineAndBatch(
        item.medicineCode,
        item.batchNo,
        order.fromStoreId,
      );

      await this.inventoryService.decreaseQuantity(
        item.medicineCode,
        item.batchNo,
        order.fromStoreId,
        item.quantity,
      );

      await this.inventoryService.increaseQuantity(
        item.medicineCode,
        item.batchNo,
        order.toStoreId,
        item.quantity,
        item.medicineName,
        item.expiryDate,
        item.sellingPrice,
        item.unit,
        order.toStoreName,
        sourceInventory?.specification,
        sourceInventory?.manufacturer,
        sourceInventory?.location,
        sourceInventory?.purchasePrice,
      );
    }
  }

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = uuidv4().substring(0, 8).toUpperCase();
    return `TR${year}${month}${day}${random}`;
  }
}
