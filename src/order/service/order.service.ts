import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, In } from "typeorm";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { QueryOrderDto } from "../dto/query-order.dto";
import { ReportNoShowDto, NoShowParty } from "../dto/report-no-show.dto";
import { HandleNoShowDto, NoShowResolutionType } from "../dto/handle-no-show.dto";
import { ClarifyServiceDto } from "../dto/clarify-service.dto";
import { AssignOrderOwnerDto } from "../dto/assign-owner.dto";
import { OrderStatus } from "../../common/enums/order-status.enum";
import { Role } from "../../common/enums";
import { ListResponseDto } from "../../common/dto/list-response.dto";
import { HousekeeperService } from "../../housekeeper/service/housekeeper.service";
import { AuditService } from "../../audit/service/audit.service";
import { AuditAction } from "../../common/enums/audit-action.enum";
import { IntakeService } from "../../intake/service/intake.service";

interface Actor {
  role: Role;
  id: string;
  name: string;
}

export interface OrderWithExtra extends Order {
  stalenessHours?: number;
  stalled?: boolean;
  auditTrail?: any[];
}

const FINAL_STATUSES = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.DISPUTED,
  OrderStatus.NO_SHOW_BY_HOUSEKEEPER,
  OrderStatus.NO_SHOW_BY_CUSTOMER,
];

function generateOrderNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return "OD-" + y + m + d + "-" + rand;
}

function calcStaleness(order: Order, now: Date): { stalenessHours: number; stalled: boolean } {
  const diffMs = now.getTime() - new Date(order.statusChangedAt).getTime();
  const stalenessHours = Math.floor(diffMs / (1000 * 60 * 60));
  const stalled = stalenessHours > 72;
  return { stalenessHours, stalled };
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly housekeeperService: HousekeeperService,
    private readonly auditService: AuditService,
    private readonly intakeService: IntakeService,
  ) {}

  private async auditQuickLog(
    entityId: string,
    action: AuditAction | string,
    actor: Actor,
    details?: any,
  ): Promise<void> {
    const remark = details !== undefined ? JSON.stringify(details) : undefined;
    await this.auditService.quickLog("ORDER", entityId, action, remark, actor);
  }

  private async getAuditTrail(id: string): Promise<any[]> {
    return this.auditService.getTrail("ORDER", id);
  }

  private async findOneOrFail(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  private async updateStatus(
    id: string,
    newStatus: OrderStatus,
    actor: Actor,
    details?: any,
  ): Promise<Order> {
    const order = await this.findOneOrFail(id);
    const oldStatus = order.status;
    if (FINAL_STATUSES.includes(oldStatus)) {
      throw new BadRequestException("Cannot change status from " + oldStatus);
    }
    order.status = newStatus;
    order.statusChangedAt = new Date();
    const saved = await this.orderRepo.save(order);
    await this.auditService.logStatusChange(
      "ORDER",
      id,
      "status",
      oldStatus,
      newStatus,
      actor,
      details ? JSON.stringify(details) : undefined,
    );
    return saved;
  }

  async create(dto: CreateOrderDto, actor: Actor): Promise<Order> {
    const orderNo = generateOrderNo();
    const now = new Date();
    const order = this.orderRepo.create({
      ...dto,
      orderNo,
      status: OrderStatus.DRAFT,
      statusChangedAt: now,
      serviceClarificationStatus: "PENDING",
      clarificationContactCount: 0,
    });
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(saved.id, AuditAction.CREATE, actor, dto);
    return saved;
  }

  async reportNoShow(dto: ReportNoShowDto, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(dto.orderId);
    const oldStatus = order.status;
    const newStatus =
      dto.noShowParty === NoShowParty.HOUSEKEEPER
        ? OrderStatus.NO_SHOW_BY_HOUSEKEEPER
        : OrderStatus.NO_SHOW_BY_CUSTOMER;
    order.status = newStatus;
    order.statusChangedAt = new Date();
    order.noShowReportedAt = new Date();
    order.noShowReason = dto.noShowReason;
    order.noShowHandlerRole = dto.handlerRole;
    order.noShowHandlerId = dto.handlerId;
    order.noShowHandlerName = dto.handlerName;
    const saved = await this.orderRepo.save(order);
    await this.auditService.logStatusChange(
      "ORDER",
      dto.orderId,
      "status",
      oldStatus,
      newStatus,
      actor,
      JSON.stringify({
        noShowParty: dto.noShowParty,
        reason: dto.noShowReason,
        handler: {
          role: dto.handlerRole,
          id: dto.handlerId,
          name: dto.handlerName,
        },
      }),
    );
    if (dto.noShowParty === NoShowParty.HOUSEKEEPER) {
      await this.housekeeperService.markNoShow(order.housekeeperId, actor);
    }
    return saved;
  }

  async handleNoShow(dto: HandleNoShowDto, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(dto.orderId);
    if (
      order.status !== OrderStatus.NO_SHOW_BY_HOUSEKEEPER &&
      order.status !== OrderStatus.NO_SHOW_BY_CUSTOMER
    ) {
      throw new BadRequestException("Order is not in a no-show status");
    }
    order.noShowResolution = dto.resolution;
    if (dto.assignOwnerRole && dto.assignOwnerId && dto.assignOwnerName) {
      order.ownerRole = dto.assignOwnerRole;
      order.ownerId = dto.assignOwnerId;
      order.ownerName = dto.assignOwnerName;
    }
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(dto.orderId, AuditAction.HANDLE_NO_SHOW, actor, {
      resolutionType: dto.resolutionType,
      resolution: dto.resolution,
      assignedOwner: dto.assignOwnerRole
        ? {
            role: dto.assignOwnerRole,
            id: dto.assignOwnerId,
            name: dto.assignOwnerName,
          }
        : null,
    });
    if (dto.resolutionType === NoShowResolutionType.REMATCH && order.intakeId) {
      await this.intakeService.startMatching(
        order.intakeId,
        actor.role,
        actor.id,
        actor.name,
      );
    }
    return saved;
  }

  async clarifyService(dto: ClarifyServiceDto, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(dto.orderId);
    const old = {
      serviceScope: order.serviceScope,
      clarificationContactCount: order.clarificationContactCount,
      serviceClarificationStatus: order.serviceClarificationStatus,
    };
    if (dto.serviceScope) {
      order.serviceScope = dto.serviceScope;
      order.serviceClarificationStatus = "CLARIFIED";
    }
    if (dto.contactCountIncrement !== false) {
      order.clarificationContactCount += 1;
    }
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(dto.orderId, AuditAction.CLARIFY, actor, {
      old,
      new: {
        serviceScope: saved.serviceScope,
        clarificationContactCount: saved.clarificationContactCount,
        serviceClarificationStatus: saved.serviceClarificationStatus,
        notes: dto.notes,
      },
    });
    return saved;
  }

  async assignOwner(
    id: string,
    dto: AssignOrderOwnerDto,
    actor: Actor,
  ): Promise<Order> {
    const order = await this.findOneOrFail(id);
    const old = {
      ownerRole: order.ownerRole,
      ownerId: order.ownerId,
      ownerName: order.ownerName,
    };
    order.ownerRole = dto.ownerRole;
    order.ownerId = dto.ownerId;
    order.ownerName = dto.ownerName;
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(id, AuditAction.ASSIGN, actor, { old, new: dto });
    return saved;
  }

  async confirm(id: string, actor: Actor): Promise<Order> {
    return this.updateStatus(id, OrderStatus.CONFIRMED, actor);
  }

  async startService(id: string, actor: Actor): Promise<Order> {
    return this.updateStatus(id, OrderStatus.IN_SERVICE, actor);
  }

  async complete(id: string, actor: Actor): Promise<Order> {
    return this.updateStatus(id, OrderStatus.COMPLETED, actor);
  }

  async cancel(id: string, reason: string, actor: Actor): Promise<Order> {
    return this.updateStatus(id, OrderStatus.CANCELLED, actor, { reason });
  }

  async openDispute(id: string, reason: string, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(id);
    order.disputeOpenedAt = new Date();
    await this.orderRepo.save(order);
    return this.updateStatus(id, OrderStatus.DISPUTED, actor, { reason });
  }

  async resolveDispute(id: string, resolution: string, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(id);
    order.disputeResolvedAt = new Date();
    await this.orderRepo.save(order);
    return this.updateStatus(id, OrderStatus.COMPLETED, actor, { resolution });
  }

  async findAll(query: QueryOrderDto): Promise<ListResponseDto<OrderWithExtra>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const where: FindOptionsWhere<Order> = {};
    if (query.status) where.status = query.status;
    if (query.intakeId) where.intakeId = query.intakeId;
    if (query.housekeeperId) where.housekeeperId = query.housekeeperId;
    const [items, total] = await this.orderRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: "DESC" },
    });
    const now = new Date();
    const list = items.map((item) => {
      const { stalenessHours, stalled } = calcStaleness(item, now);
      return { ...item, stalenessHours, stalled };
    });
    return new ListResponseDto(list, total, page, pageSize);
  }

  async findOne(id: string): Promise<OrderWithExtra> {
    const order = await this.findOneOrFail(id);
    const now = new Date();
    const { stalenessHours, stalled } = calcStaleness(order, now);
    const auditTrail = await this.getAuditTrail(id);
    return { ...order, stalenessHours, stalled, auditTrail };
  }

  async getAuditTrailOnly(id: string): Promise<any[]> {
    await this.findOneOrFail(id);
    return this.getAuditTrail(id);
  }

  async update(id: string, dto: UpdateOrderDto, actor: Actor): Promise<Order> {
    const order = await this.findOneOrFail(id);
    Object.assign(order, dto);
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(id, AuditAction.UPDATE, actor, dto);
    return saved;
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const order = await this.findOneOrFail(id);
    await this.orderRepo.remove(order);
    await this.auditQuickLog(id, AuditAction.DELETE, actor, { action: "DELETE" });
  }

  async detectStalledOrders(): Promise<OrderWithExtra[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const nonFinalStatuses = Object.values(OrderStatus).filter(
      (s) => !FINAL_STATUSES.includes(s),
    );
    const orders = await this.orderRepo.find({
      where: {
        status: In(nonFinalStatuses),
      },
    });
    return orders
      .filter((order) => new Date(order.statusChangedAt) <= cutoff)
      .map((order) => {
        const { stalenessHours, stalled } = calcStaleness(order, now);
        return { ...order, stalenessHours, stalled };
      });
  }
}
