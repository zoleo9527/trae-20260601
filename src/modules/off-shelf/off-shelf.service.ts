import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';


import { OffShelfOrder, AuditLog, OffShelfItem } from './entities/off-shelf-order.entity';
import { OffShelfStatus } from './enums/off-shelf-status.enum';
import { OffShelfAction } from './enums/off-shelf-action.enum';
import { OffShelfReason } from './enums/off-shelf-reason.enum';
import { OffShelfStateMachine } from './state-machine/off-shelf.state-machine';
import { CreateOffShelfOrderDto } from './dto/create-off-shelf-order.dto';
import { SubmitOffShelfDto } from './dto/submit-off-shelf.dto';
import { ConfirmOffShelfDto } from './dto/confirm-off-shelf.dto';
import { RejectOffShelfDto } from './dto/reject-off-shelf.dto';
import { CancelOffShelfDto } from './dto/cancel-off-shelf.dto';
import { QueryOffShelfDto } from './dto/query-off-shelf.dto';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/error-codes';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';
import { MedicineInventory } from '../inventory/entities/medicine-inventory.entity';
import { NearExpiryAlert } from '../inventory/entities/near-expiry-alert.entity';

@Injectable()
export class OffShelfService {
  constructor(
    @InjectRepository(OffShelfOrder)
    private readonly offShelfRepository: Repository<OffShelfOrder>,
    private readonly stateMachine: OffShelfStateMachine,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateOffShelfOrderDto,
    ctx: RequestContext,
  ): Promise<OffShelfOrder> {
    const totalQuantity = dto.items.reduce((sum, item) => sum + item.quantity, 0);

    const order = this.offShelfRepository.create({
      orderNo: `OS${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      reason: dto.reason,
      reasonDetail: dto.reasonDetail,
      items: dto.items as OffShelfItem[],
      totalQuantity,
      currentStatus: OffShelfStatus.CREATED,
      storeId: ctx.storeId,
      storeName: ctx.storeName,
      auditLogs: [],
    });

    return this.offShelfRepository.save(order);
  }

  async findAll(query: QueryOffShelfDto): Promise<PaginatedResult<OffShelfOrder>> {
    const { page, pageSize, sortBy, sortOrder, currentStatus, reason, storeId, startTime, endTime } = query;

    const where: any = {};

    if (currentStatus) {
      where.currentStatus = currentStatus;
    }
    if (reason) {
      where.reason = reason;
    }
    if (storeId) {
      where.storeId = storeId;
    }
    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    const [items, total] = await this.offShelfRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<OffShelfOrder> {
    const order = await this.offShelfRepository.findOne({ where: { id } });
    if (!order) {
      throw new BusinessException(ErrorCode.OFF_SHELF_NOT_FOUND, `下架单 ${id} 不存在`, { id });
    }
    return order;
  }

  async update(id: string, dto: CreateOffShelfOrderDto, ctx: RequestContext): Promise<OffShelfOrder> {
    const order = await this.findOne(id);

    if (order.currentStatus !== OffShelfStatus.CREATED) {
      throw new BusinessException(
        ErrorCode.OFF_SHELF_INVALID_STATE,
        '仅 CREATED 状态的下架单可以修改',
        { id, currentStatus: order.currentStatus },
      );
    }

    const totalQuantity = dto.items.reduce((sum, item) => sum + item.quantity, 0);

    order.reason = dto.reason;
    order.reasonDetail = dto.reasonDetail;
    order.items = dto.items as OffShelfItem[];
    order.totalQuantity = totalQuantity;

    return this.offShelfRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    if (order.currentStatus !== OffShelfStatus.CREATED) {
      throw new BusinessException(
        ErrorCode.OFF_SHELF_INVALID_STATE,
        '仅 CREATED 状态的下架单可以删除',
        { id, currentStatus: order.currentStatus },
      );
    }

    await this.offShelfRepository.delete(id);
  }

  async submit(id: string, dto: SubmitOffShelfDto, ctx: RequestContext): Promise<OffShelfOrder> {
    const order = await this.findOne(id);

    this.stateMachine.validateTransition(order.currentStatus, OffShelfAction.SUBMIT, ctx.userRole);

    const fromStatus = order.currentStatus;
    const toStatus = this.stateMachine.getNextState(order.currentStatus, OffShelfAction.SUBMIT);

    const auditLog: AuditLog = {
      action: OffShelfAction.SUBMIT,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      fromStatus,
      toStatus,
      timestamp: new Date(),
      remark: dto.remark,
    };

    order.currentStatus = toStatus;
    order.submitterId = ctx.userId;
    order.submitterName = ctx.userName;
    order.submitTime = new Date();
    order.auditLogs = [...order.auditLogs, auditLog];

    return this.offShelfRepository.save(order);
  }

  async confirm(id: string, dto: ConfirmOffShelfDto, ctx: RequestContext): Promise<OffShelfOrder> {
    const order = await this.findOne(id);

    this.stateMachine.validateTransition(order.currentStatus, OffShelfAction.CONFIRM, ctx.userRole);

    const fromStatus = order.currentStatus;
    const toStatus = this.stateMachine.getNextState(order.currentStatus, OffShelfAction.CONFIRM);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.deductInventory(order.items, order.storeId, queryRunner);

      if (order.reason === OffShelfReason.NEAR_EXPIRY) {
        await this.resolveNearExpiryAlerts(order.items, order.storeId, queryRunner);
      }

      const auditLog: AuditLog = {
        action: OffShelfAction.CONFIRM,
        operatorId: ctx.userId,
        operatorName: ctx.userName,
        fromStatus,
        toStatus,
        timestamp: new Date(),
        remark: dto.remark,
      };

      order.currentStatus = toStatus;
      order.reviewerId = ctx.userId;
      order.reviewerName = ctx.userName;
      order.reviewTime = new Date();
      order.reviewRemark = dto.remark;
      order.auditLogs = [...order.auditLogs, auditLog];

      const result = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(id: string, dto: RejectOffShelfDto, ctx: RequestContext): Promise<OffShelfOrder> {
    const order = await this.findOne(id);

    this.stateMachine.validateTransition(order.currentStatus, OffShelfAction.REJECT, ctx.userRole);

    const fromStatus = order.currentStatus;
    const toStatus = this.stateMachine.getNextState(order.currentStatus, OffShelfAction.REJECT);

    const auditLog: AuditLog = {
      action: OffShelfAction.REJECT,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      fromStatus,
      toStatus,
      timestamp: new Date(),
      remark: dto.remark,
    };

    order.currentStatus = toStatus;
    order.reviewerId = ctx.userId;
    order.reviewerName = ctx.userName;
    order.reviewTime = new Date();
    order.reviewRemark = dto.remark;
    order.rejectReason = dto.rejectReason;
    order.auditLogs = [...order.auditLogs, auditLog];

    return this.offShelfRepository.save(order);
  }

  async cancel(id: string, dto: CancelOffShelfDto, ctx: RequestContext): Promise<OffShelfOrder> {
    const order = await this.findOne(id);

    this.stateMachine.validateTransition(order.currentStatus, OffShelfAction.CANCEL, ctx.userRole);

    const fromStatus = order.currentStatus;
    const toStatus = this.stateMachine.getNextState(order.currentStatus, OffShelfAction.CANCEL);

    const auditLog: AuditLog = {
      action: OffShelfAction.CANCEL,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      fromStatus,
      toStatus,
      timestamp: new Date(),
      remark: dto.remark,
    };

    order.currentStatus = toStatus;
    order.auditLogs = [...order.auditLogs, auditLog];

    return this.offShelfRepository.save(order);
  }

  async getAllowedActions(id: string, ctx: RequestContext): Promise<OffShelfAction[]> {
    const order = await this.findOne(id);
    return this.stateMachine.getAllowedActions(order.currentStatus, ctx.userRole);
  }

  private async deductInventory(
    items: OffShelfItem[],
    storeId: string,
    queryRunner: any,
  ): Promise<void> {
    const inventoryIds = items.map((item) => item.inventoryId);

    const inventories = await queryRunner.manager.find(MedicineInventory, {
      where: {
        id: In(inventoryIds),
        storeId,
      } as any,
    });

    for (const item of items) {
      const inventory = inventories.find((inv: MedicineInventory) => inv.id === item.inventoryId);
      if (!inventory) {
        throw new BusinessException(
          ErrorCode.INVENTORY_NOT_FOUND,
          `库存记录不存在: inventoryId=${item.inventoryId}`,
          { inventoryId: item.inventoryId },
        );
      }
      if (inventory.quantity < item.quantity) {
        throw new BusinessException(
          ErrorCode.INVENTORY_INSUFFICIENT,
          `库存不足: inventoryId=${item.inventoryId}, 现有=${inventory.quantity}, 需要=${item.quantity}`,
          { inventoryId: item.inventoryId, available: inventory.quantity, required: item.quantity },
        );
      }

      await queryRunner.manager.update(
        MedicineInventory,
        { id: item.inventoryId },
        { quantity: inventory.quantity - item.quantity } as any,
      );
    }
  }

  private async resolveNearExpiryAlerts(
    items: OffShelfItem[],
    storeId: string,
    queryRunner: any,
  ): Promise<void> {
    const inventoryIds = items.map((item) => item.inventoryId);

    const alerts = await queryRunner.manager.find(NearExpiryAlert, {
      where: {
        inventoryId: In(inventoryIds),
        storeId,
        status: 'ACTIVE',
      } as any,
    });

    for (const alert of alerts) {
      await queryRunner.manager.update(
        NearExpiryAlert,
        { id: alert.id },
        { status: 'RESOLVED', resolvedAt: new Date() } as any,
      );
    }
  }
}
