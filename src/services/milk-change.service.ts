import { Injectable } from '@nestjs/common';
import { Repository, In, MoreThan, LessThan, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MilkChange } from '../entities/milk-change.entity';
import { Customer } from '../entities/customer.entity';
import { Staff } from '../entities/staff.entity';
import { DeliveryRoute } from '../entities/delivery-route.entity';
import { RouteAdjustHistory } from '../entities/route-adjust-history.entity';
import {
  MilkChangeStatus,
  MilkChangeType,
  StaffRole,
  OperationType,
  MilkChangeStatusLabel,
  MilkChangeTypeLabel,
  StaffRoleLabel,
  ReturnReasonLabel,
} from '../common/enums';
import { ErrorCode, ErrorMessage } from '../common/error-code';
import { BusinessException } from '../common/business-exception';
import {
  CreateMilkChangeDto,
  ProcessMilkChangeDto,
  ListMilkChangeDto,
  AssignRouteDto,
} from '../dto/milk-change.dto';
import { OperationLogService } from './operation-log.service';

@Injectable()
export class MilkChangeService {
  constructor(
    @InjectRepository(MilkChange)
    private readonly milkChangeRepository: Repository<MilkChange>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(RouteAdjustHistory)
    private readonly routeAdjustHistoryRepository: Repository<RouteAdjustHistory>,
    private readonly operationLogService: OperationLogService,
  ) {}

  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getEndOfToday(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  private async getStaffById(id: string): Promise<Staff> {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new BusinessException(ErrorCode.STAFF_NOT_FOUND);
    }
    return staff;
  }

  private async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new BusinessException(ErrorCode.CUSTOMER_NOT_FOUND);
    }
    return customer;
  }

  private async getRouteNameById(routeId: string): Promise<string> {
    if (!routeId) return '';
    const route = await this.routeRepository.findOne({ where: { id: routeId } });
    return route ? route.name : '';
  }

  private async validateAndGetRoute(routeId: string): Promise<{ id: string; name: string }> {
    if (!routeId) {
      throw new BusinessException(ErrorCode.ROUTE_NOT_FOUND);
    }
    const route = await this.routeRepository.findOne({ where: { id: routeId } });
    if (!route) {
      throw new BusinessException(ErrorCode.ROUTE_NOT_FOUND);
    }
    return { id: route.id, name: route.name };
  }

  async create(dto: CreateMilkChangeDto): Promise<MilkChange> {
    await this.getCustomerById(dto.customerId);

    let assignedTo = null;
    if (dto.assignedToId) {
      assignedTo = await this.getStaffById(dto.assignedToId);
    }

    const status = dto.assignedToId
      ? MilkChangeStatus.PENDING_CLERK
      : MilkChangeStatus.PENDING_CLERK;

    const milkChange = this.milkChangeRepository.create({
      customerId: dto.customerId,
      changeType: dto.changeType,
      changeDetail: dto.changeDetail,
      oldProduct: dto.oldProduct,
      oldQuantity: dto.oldQuantity,
      newProduct: dto.newProduct,
      newQuantity: dto.newQuantity,
      oldAddress: dto.oldAddress,
      newAddress: dto.newAddress,
      oldDeliveryTime: dto.oldDeliveryTime,
      newDeliveryTime: dto.newDeliveryTime,
      oldRouteId: dto.oldRouteId,
      oldRouteName: dto.oldRouteName,
      newRouteId: dto.newRouteId,
      newRouteName: dto.newRouteName,
      routeAdjustReason: dto.routeAdjustReason,
      status,
      assignedToId: dto.assignedToId,
      currentHandlerId: dto.assignedToId,
      remark: dto.remark,
      supplementRemark: dto.supplementRemark,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
      expectedCompleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const saved = await this.milkChangeRepository.save(milkChange);

    const operatorName = assignedTo ? assignedTo.name : '系统';
    await this.operationLogService.createLog(
      saved.id,
      OperationType.CREATE,
      dto.assignedToId,
      operatorName,
      null,
      status,
      dto.remark || '创建订奶变更',
    );

    return saved;
  }

  async getDetail(id: string): Promise<MilkChange> {
    const milkChange = await this.milkChangeRepository.findOne({
      where: { id },
      relations: ['customer', 'currentHandler', 'assignedTo'],
    });
    if (!milkChange) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_NOT_FOUND);
    }
    return milkChange;
  }

  async getMyTodoList(
    staffId: string,
    staffRole: StaffRole,
    dto: ListMilkChangeDto,
  ): Promise<{ list: any[]; total: number; today: number; overdue: number; returned: number }> {
    await this.getStaffById(staffId);

    let statuses: MilkChangeStatus[] = [];
    switch (staffRole) {
      case StaffRole.STATION_CLERK:
        statuses = [
          MilkChangeStatus.PENDING_CLERK,
          MilkChangeStatus.CLERK_PROCESSING,
        ];
        break;
      case StaffRole.DELIVERY_STAFF:
        statuses = [
          MilkChangeStatus.PENDING_DELIVERY,
          MilkChangeStatus.DELIVERY_IN_PROGRESS,
        ];
        break;
      case StaffRole.CUSTOMER_SERVICE:
        statuses = [
          MilkChangeStatus.PENDING_CUSTOMER_SERVICE,
          MilkChangeStatus.CUSTOMER_SERVICE_PROCESSING,
        ];
        break;
    }

    const todayStart = this.getStartOfToday();
    const todayEnd = this.getEndOfToday();

    const [allItems, total] = await this.milkChangeRepository.findAndCount({
      where: [
        { status: In(statuses), currentHandlerId: staffId },
        { status: MilkChangeStatus.RETURNED, currentHandlerId: staffId },
      ],
      relations: ['customer', 'currentHandler', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });

    const todayItems = allItems.filter(
      item =>
        item.createdAt >= todayStart &&
        item.createdAt <= todayEnd &&
        statuses.includes(item.status),
    );
    const overdueItems = allItems.filter(item => this.isOverdue(item) && statuses.includes(item.status));
    const returnedItems = allItems.filter(item => item.status === MilkChangeStatus.RETURNED);

    const list = allItems.map(item => {
      const formatted = this.formatListItem(item);
      formatted.isOverdue = this.isOverdue(item) && statuses.includes(item.status);
      if (formatted.isOverdue && !formatted.statusLabel.includes('逾期')) {
        formatted.statusLabel = `已逾期 - ${formatted.statusLabel}`;
      }
      return formatted;
    });

    return {
      list,
      total,
      today: todayItems.length,
      overdue: overdueItems.length,
      returned: returnedItems.length,
    };
  }

  private isOverdue(item: MilkChange): boolean {
    if (!item.expectedCompleteAt) return false;
    if (item.status === MilkChangeStatus.COMPLETED || item.status === MilkChangeStatus.CANCELLED) {
      return false;
    }
    return new Date(item.expectedCompleteAt) < new Date();
  }

  async getDefaultList(dto: ListMilkChangeDto): Promise<{ list: any[]; total: number }> {
    const todayStart = this.getStartOfToday();
    const todayEnd = this.getEndOfToday();
    const now = new Date();

    const activeStatuses = [
      MilkChangeStatus.PENDING_CLERK,
      MilkChangeStatus.CLERK_PROCESSING,
      MilkChangeStatus.PENDING_DELIVERY,
      MilkChangeStatus.DELIVERY_IN_PROGRESS,
      MilkChangeStatus.PENDING_CUSTOMER_SERVICE,
      MilkChangeStatus.CUSTOMER_SERVICE_PROCESSING,
    ];

    const todayItems = await this.milkChangeRepository.find({
      where: {
        createdAt: Between(todayStart, todayEnd),
        status: In(activeStatuses),
      },
      relations: ['customer', 'currentHandler', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });

    const allActiveItems = await this.milkChangeRepository.find({
      where: {
        status: In(activeStatuses),
        expectedCompleteAt: LessThan(now),
      },
      relations: ['customer', 'currentHandler', 'assignedTo'],
      order: { expectedCompleteAt: 'ASC' },
    });
    const overdueItems = allActiveItems.filter(item => this.isOverdue(item));

    const returnedItems = await this.milkChangeRepository.find({
      where: {
        status: MilkChangeStatus.RETURNED,
        updatedAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
      relations: ['customer', 'currentHandler', 'assignedTo'],
      order: { updatedAt: 'DESC' },
    });

    const allItems = [...todayItems, ...overdueItems, ...returnedItems];

    const seen = new Set<string>();
    const uniqueItems = allItems.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const list = uniqueItems.map(item => {
      const formatted = this.formatListItem(item);
      formatted.isOverdue = this.isOverdue(item);
      if (formatted.isOverdue && !formatted.statusLabel.includes('逾期')) {
        formatted.statusLabel = `已逾期 - ${formatted.statusLabel}`;
      }
      return formatted;
    });

    return {
      list,
      total: list.length,
    };
  }

  async list(dto: ListMilkChangeDto): Promise<{ list: any[]; total: number }> {
    const where: any = {};
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.customerId) {
      where.customerId = dto.customerId;
    }
    if (dto.handlerId) {
      where.currentHandlerId = dto.handlerId;
    }

    const [items, total] = await this.milkChangeRepository.findAndCount({
      where,
      relations: ['customer', 'currentHandler', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: dto.pageSize || 20,
      skip: ((dto.page || 1) - 1) * (dto.pageSize || 20),
    });

    const list = items.map(item => this.formatListItem(item));

    return { list, total };
  }

  private validateDeliveryTime(time: string): boolean {
    if (!time) return true;
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  async process(id: string, dto: ProcessMilkChangeDto): Promise<MilkChange> {
    const milkChange = await this.getDetail(id);
    const handler = await this.getStaffById(dto.handlerId);

    if (!this.isValidStatusTransition(milkChange.status, dto.targetStatus, handler.role)) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_STATUS_TRANSITION_INVALID);
    }

    if (dto.targetStatus === MilkChangeStatus.RETURNED && !dto.returnReason) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_RETURN_REASON_REQUIRED);
    }

    if (dto.newQuantity !== undefined && dto.newQuantity <= 0) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_QUANTITY_INVALID);
    }

    if (dto.newDeliveryTime && !this.validateDeliveryTime(dto.newDeliveryTime)) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_DELIVERY_TIME_INVALID);
    }

    if (dto.newAddress && !dto.newRouteId) {
      throw new BusinessException(ErrorCode.MILK_CHANGE_ROUTE_REQUIRED);
    }

    if (dto.expectedCompleteAt) {
      const expectedTime = new Date(dto.expectedCompleteAt);
      if (expectedTime < new Date()) {
        throw new BusinessException(ErrorCode.MILK_CHANGE_EXPECTED_TIME_INVALID);
      }
    }

    const fromStatus = milkChange.status;
    const operationType = this.getOperationType(fromStatus, dto.targetStatus);

    milkChange.status = dto.targetStatus;
    milkChange.currentHandlerId = dto.handlerId;

    if (dto.remark) {
      milkChange.remark = dto.remark;
    }
    if (dto.returnReason) {
      milkChange.returnReason = dto.returnReason;
    }
    if (dto.returnDetail) {
      milkChange.returnDetail = dto.returnDetail;
    }
    if (dto.supplementRemark) {
      milkChange.supplementRemark = dto.supplementRemark;
    }
    if (dto.changeDetail) {
      milkChange.changeDetail = dto.changeDetail;
    }
    if (dto.newProduct) {
      milkChange.newProduct = dto.newProduct;
    }
    if (dto.newQuantity !== undefined) {
      milkChange.newQuantity = dto.newQuantity;
    }
    if (dto.newAddress) {
      if (!milkChange.oldAddress) {
        milkChange.oldAddress = milkChange.customer?.address || '';
      }
      milkChange.newAddress = dto.newAddress;
    }
    if (dto.newDeliveryTime) {
      if (!milkChange.oldDeliveryTime) {
        milkChange.oldDeliveryTime = milkChange.customer?.deliveryTime || '';
      }
      milkChange.newDeliveryTime = dto.newDeliveryTime;
    }
    if (dto.effectiveDate) {
      milkChange.effectiveDate = new Date(dto.effectiveDate);
    }
    if (dto.expectedCompleteAt) {
      milkChange.expectedCompleteAt = new Date(dto.expectedCompleteAt);
    }
    if (dto.assignedToId) {
      await this.getStaffById(dto.assignedToId);
      milkChange.assignedToId = dto.assignedToId;
      milkChange.currentHandlerId = dto.assignedToId;
    }

    if (dto.newRouteId) {
      const validRoute = await this.validateAndGetRoute(dto.newRouteId);
      
      let currentRouteId = milkChange.newRouteId || milkChange.oldRouteId;
      let currentRouteName = milkChange.newRouteName || milkChange.oldRouteName;
      
      if (!currentRouteId && milkChange.customer?.routeId) {
        currentRouteId = milkChange.customer.routeId;
        currentRouteName = await this.getRouteNameById(currentRouteId);
      }
      
      if (currentRouteId && currentRouteId !== validRoute.id) {
        await this.createRouteAdjustHistory(
          milkChange.id,
          currentRouteId,
          currentRouteName,
          validRoute.id,
          validRoute.name,
          dto.routeAdjustReason || '路线调整',
          handler.id,
          handler.name,
        );
      }
      
      if (!milkChange.oldRouteId && currentRouteId) {
        milkChange.oldRouteId = currentRouteId;
        milkChange.oldRouteName = currentRouteName;
      }
      
      milkChange.newRouteId = validRoute.id;
      milkChange.newRouteName = validRoute.name;
      milkChange.routeAdjustReason = dto.routeAdjustReason || milkChange.routeAdjustReason;
    }

    if (dto.targetStatus === MilkChangeStatus.COMPLETED) {
      milkChange.completedAt = new Date();
    }

    const saved = await this.milkChangeRepository.save(milkChange);

    await this.operationLogService.createLog(
      saved.id,
      operationType,
      handler.id,
      handler.name,
      fromStatus,
      dto.targetStatus,
      dto.remark,
    );

    return saved;
  }

  async assignRoute(id: string, dto: AssignRouteDto): Promise<MilkChange> {
    const milkChange = await this.getDetail(id);
    const handler = await this.getStaffById(dto.handlerId);
    const validRoute = await this.validateAndGetRoute(dto.newRouteId);

    let currentRouteId = milkChange.newRouteId || milkChange.oldRouteId;
    let currentRouteName = milkChange.newRouteName || milkChange.oldRouteName;

    if (!currentRouteId && milkChange.customer?.routeId) {
      currentRouteId = milkChange.customer.routeId;
      currentRouteName = await this.getRouteNameById(currentRouteId);
    }

    if (currentRouteId && currentRouteId !== validRoute.id) {
      await this.createRouteAdjustHistory(
        milkChange.id,
        currentRouteId,
        currentRouteName,
        validRoute.id,
        validRoute.name,
        dto.routeAdjustReason || '路线调整',
        handler.id,
        handler.name,
      );
    }

    if (!milkChange.oldRouteId && currentRouteId) {
      milkChange.oldRouteId = currentRouteId;
      milkChange.oldRouteName = currentRouteName;
    }

    milkChange.newRouteId = validRoute.id;
    milkChange.newRouteName = validRoute.name;
    milkChange.routeAdjustReason = dto.routeAdjustReason || milkChange.routeAdjustReason;

    const saved = await this.milkChangeRepository.save(milkChange);

    await this.operationLogService.createLog(
      saved.id,
      OperationType.ROUTE_ADJUST,
      handler.id,
      handler.name,
      milkChange.status,
      milkChange.status,
      dto.remark || `路线调整: ${validRoute.name}`,
    );

    return saved;
  }

  async getOperationLogs(id: string): Promise<any[]> {
    await this.getDetail(id);
    return await this.operationLogService.getLogsByMilkChangeId(id);
  }

  async getRouteAdjustHistories(id: string): Promise<any[]> {
    await this.getDetail(id);
    const histories = await this.routeAdjustHistoryRepository.find({
      where: { milkChangeId: id },
      order: { createdAt: 'DESC' },
    });
    return histories.map(h => ({
      id: h.id,
      oldRouteId: h.oldRouteId,
      oldRouteName: h.oldRouteName,
      newRouteId: h.newRouteId,
      newRouteName: h.newRouteName,
      adjustReason: h.adjustReason,
      operatorId: h.operatorId,
      operatorName: h.operatorName,
      createdAt: h.createdAt,
    }));
  }

  async getReview(id: string): Promise<{ detail: any; logs: any[]; routeHistories: any[] }> {
    const milkChange = await this.getDetail(id);
    const logs = await this.getOperationLogs(id);
    const routeHistories = await this.getRouteAdjustHistories(id);

    return {
      detail: this.formatDetail(milkChange),
      logs,
      routeHistories,
    };
  }

  private async createRouteAdjustHistory(
    milkChangeId: string,
    oldRouteId: string,
    oldRouteName: string,
    newRouteId: string,
    newRouteName: string,
    adjustReason: string,
    operatorId: string,
    operatorName: string,
  ): Promise<RouteAdjustHistory> {
    const history = this.routeAdjustHistoryRepository.create({
      milkChangeId,
      oldRouteId,
      oldRouteName,
      newRouteId,
      newRouteName,
      adjustReason,
      operatorId,
      operatorName,
    });
    return await this.routeAdjustHistoryRepository.save(history);
  }

  private isValidStatusTransition(
    from: MilkChangeStatus,
    to: MilkChangeStatus,
    role: StaffRole,
  ): boolean {
    const validTransitions: Record<MilkChangeStatus, { to: MilkChangeStatus[]; roles: StaffRole[] }[]> = {
      [MilkChangeStatus.PENDING_CLERK]: [
        { to: [MilkChangeStatus.CLERK_PROCESSING], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.PENDING_DELIVERY], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.CANCELLED], roles: [StaffRole.STATION_CLERK] },
      ],
      [MilkChangeStatus.CLERK_PROCESSING]: [
        { to: [MilkChangeStatus.PENDING_DELIVERY], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.PENDING_CUSTOMER_SERVICE], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.COMPLETED], roles: [StaffRole.STATION_CLERK] },
      ],
      [MilkChangeStatus.PENDING_DELIVERY]: [
        { to: [MilkChangeStatus.DELIVERY_IN_PROGRESS], roles: [StaffRole.DELIVERY_STAFF] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.DELIVERY_STAFF] },
      ],
      [MilkChangeStatus.DELIVERY_IN_PROGRESS]: [
        { to: [MilkChangeStatus.COMPLETED], roles: [StaffRole.DELIVERY_STAFF] },
        { to: [MilkChangeStatus.PENDING_CUSTOMER_SERVICE], roles: [StaffRole.DELIVERY_STAFF] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.DELIVERY_STAFF] },
      ],
      [MilkChangeStatus.PENDING_CUSTOMER_SERVICE]: [
        { to: [MilkChangeStatus.CUSTOMER_SERVICE_PROCESSING], roles: [StaffRole.CUSTOMER_SERVICE] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.CUSTOMER_SERVICE] },
      ],
      [MilkChangeStatus.CUSTOMER_SERVICE_PROCESSING]: [
        { to: [MilkChangeStatus.PENDING_CLERK], roles: [StaffRole.CUSTOMER_SERVICE] },
        { to: [MilkChangeStatus.COMPLETED], roles: [StaffRole.CUSTOMER_SERVICE] },
        { to: [MilkChangeStatus.RETURNED], roles: [StaffRole.CUSTOMER_SERVICE] },
      ],
      [MilkChangeStatus.RETURNED]: [
        { to: [MilkChangeStatus.PENDING_CLERK], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.PENDING_DELIVERY], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.PENDING_CUSTOMER_SERVICE], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.CANCELLED], roles: [StaffRole.STATION_CLERK] },
      ],
      [MilkChangeStatus.OVERDUE]: [
        { to: [MilkChangeStatus.PENDING_CLERK], roles: [StaffRole.STATION_CLERK] },
        { to: [MilkChangeStatus.CANCELLED], roles: [StaffRole.STATION_CLERK] },
      ],
      [MilkChangeStatus.COMPLETED]: [],
      [MilkChangeStatus.CANCELLED]: [],
    };

    const transitions = validTransitions[from] || [];
    return transitions.some(
      t => t.to.includes(to) && t.roles.includes(role),
    );
  }

  private getOperationType(
    from: MilkChangeStatus,
    to: MilkChangeStatus,
  ): OperationType {
    if (to === MilkChangeStatus.RETURNED) return OperationType.RETURN;
    if (to === MilkChangeStatus.COMPLETED) return OperationType.COMPLETE;
    if (to === MilkChangeStatus.CANCELLED) return OperationType.REJECT;
    if (from === MilkChangeStatus.RETURNED) return OperationType.TRANSFER;
    return OperationType.UPDATE;
  }

  private formatListItem(item: MilkChange): any {
    return {
      id: item.id,
      customer: item.customer
        ? {
            id: item.customer.id,
            name: item.customer.name,
            phone: item.customer.phone,
            address: item.customer.address,
          }
        : null,
      changeType: item.changeType,
      changeTypeLabel: MilkChangeTypeLabel[item.changeType] || item.changeType,
      changeDetail: item.changeDetail,
      status: item.status,
      statusLabel: MilkChangeStatusLabel[item.status] || item.status,
      currentHandler: item.currentHandler
        ? {
            id: item.currentHandler.id,
            name: item.currentHandler.name,
            role: item.currentHandler.role,
            roleLabel: StaffRoleLabel[item.currentHandler.role] || item.currentHandler.role,
          }
        : null,
      assignedTo: item.assignedTo
        ? {
            id: item.assignedTo.id,
            name: item.assignedTo.name,
            role: item.assignedTo.role,
            roleLabel: StaffRoleLabel[item.assignedTo.role] || item.assignedTo.role,
          }
        : null,
      oldRouteName: item.oldRouteName,
      newRouteName: item.newRouteName,
      returnReason: item.returnReason,
      returnReasonLabel: item.returnReason ? ReturnReasonLabel[item.returnReason] : null,
      returnDetail: item.returnDetail,
      supplementRemark: item.supplementRemark,
      remark: item.remark,
      effectiveDate: item.effectiveDate,
      expectedCompleteAt: item.expectedCompleteAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private formatDetail(item: MilkChange): any {
    return {
      id: item.id,
      customer: item.customer
        ? {
            id: item.customer.id,
            name: item.customer.name,
            phone: item.customer.phone,
            address: item.customer.address,
            addressDetail: item.customer.addressDetail,
            currentProduct: item.customer.currentProduct,
            currentQuantity: item.customer.currentQuantity,
            deliveryTime: item.customer.deliveryTime,
            routeId: item.customer.routeId,
          }
        : null,
      changeType: item.changeType,
      changeTypeLabel: MilkChangeTypeLabel[item.changeType] || item.changeType,
      changeDetail: item.changeDetail,
      oldProduct: item.oldProduct,
      oldQuantity: item.oldQuantity,
      newProduct: item.newProduct,
      newQuantity: item.newQuantity,
      oldAddress: item.oldAddress,
      newAddress: item.newAddress,
      oldDeliveryTime: item.oldDeliveryTime,
      newDeliveryTime: item.newDeliveryTime,
      oldRouteId: item.oldRouteId,
      oldRouteName: item.oldRouteName,
      newRouteId: item.newRouteId,
      newRouteName: item.newRouteName,
      routeAdjustReason: item.routeAdjustReason,
      status: item.status,
      statusLabel: MilkChangeStatusLabel[item.status] || item.status,
      currentHandler: item.currentHandler
        ? {
            id: item.currentHandler.id,
            name: item.currentHandler.name,
            role: item.currentHandler.role,
            roleLabel: StaffRoleLabel[item.currentHandler.role] || item.currentHandler.role,
          }
        : null,
      assignedTo: item.assignedTo
        ? {
            id: item.assignedTo.id,
            name: item.assignedTo.name,
            role: item.assignedTo.role,
            roleLabel: StaffRoleLabel[item.assignedTo.role] || item.assignedTo.role,
          }
        : null,
      remark: item.remark,
      returnReason: item.returnReason,
      returnReasonLabel: item.returnReason ? ReturnReasonLabel[item.returnReason] : null,
      returnDetail: item.returnDetail,
      supplementRemark: item.supplementRemark,
      effectiveDate: item.effectiveDate,
      expectedCompleteAt: item.expectedCompleteAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
