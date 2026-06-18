const fs = require('fs');
const path = require('path');

const base = '/Users/liu/Documents/private/model-test/trae-20260601-5/src';

const files = {
  // ===== Order DTOs =====
  'order/dto/create-order.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Role } from '../../common/enums';

export class CreateOrderDto {
  @ApiPropertyOptional({ description: '关联客户需求ID' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiProperty({ description: '阿姨ID' })
  @IsNotEmpty()
  @IsUUID()
  housekeeperId: string;

  @ApiProperty({ description: '客户姓名' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: '客户电话' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @ApiProperty({ description: '服务地址' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: '服务类型' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  serviceType: string;

  @ApiPropertyOptional({ description: '订单级服务内容澄清' })
  @IsOptional()
  @IsString()
  serviceScope?: string;

  @ApiProperty({ description: '排班开始时间' })
  @IsNotEmpty()
  @IsDateString()
  scheduledStart: Date;

  @ApiPropertyOptional({ description: '排班结束时间' })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: Date;

  @ApiProperty({ description: '订单金额/月(分)' })
  @IsNotEmpty()
  @IsInt()
  salaryAmount: number;

  @ApiPropertyOptional({ description: '责任人角色' })
  @IsOptional()
  ownerRole?: Role;

  @ApiPropertyOptional({ description: '责任人ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerId?: string;

  @ApiPropertyOptional({ description: '责任人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerName?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
`,

  'order/dto/update-order.dto.ts': `import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '爽约原因描述' })
  @IsOptional()
  @IsString()
  noShowReason?: string;

  @ApiPropertyOptional({ description: '爽约处理责任人角色', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  noShowHandlerRole?: Role;

  @ApiPropertyOptional({ description: '爽约处理责任人ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noShowHandlerId?: string;

  @ApiPropertyOptional({ description: '爽约处理责任人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noShowHandlerName?: string;

  @ApiPropertyOptional({ description: '处理方案' })
  @IsOptional()
  @IsString()
  noShowResolution?: string;

  @ApiPropertyOptional({ description: '服务内容争议状态', enum: ['PENDING', 'CLARIFIED', 'IN_DISPUTE'] })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  serviceClarificationStatus?: string;

  @ApiPropertyOptional({ description: '与客户联系澄清次数' })
  @IsOptional()
  @IsInt()
  clarificationContactCount?: number;

  @ApiPropertyOptional({ description: '纠纷发起时间' })
  @IsOptional()
  @IsDateString()
  disputeOpenedAt?: Date;

  @ApiPropertyOptional({ description: '纠纷解决时间' })
  @IsOptional()
  @IsDateString()
  disputeResolvedAt?: Date;
}
`,

  'order/dto/query-order.dto.ts': `import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '关联客户需求ID' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiPropertyOptional({ description: '阿姨ID' })
  @IsOptional()
  @IsUUID()
  housekeeperId?: string;
}
`,

  'order/dto/report-no-show.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Role } from '../../common/enums';

export enum NoShowParty {
  HOUSEKEEPER = 'HOUSEKEEPER',
  CUSTOMER = 'CUSTOMER',
}

export class ReportNoShowDto {
  @ApiProperty({ description: '订单ID' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: '爽约方', enum: NoShowParty })
  @IsNotEmpty()
  @IsEnum(NoShowParty)
  noShowParty: NoShowParty;

  @ApiProperty({ description: '爽约原因描述' })
  @IsNotEmpty()
  @IsString()
  noShowReason: string;

  @ApiPropertyOptional({ description: '处理责任人角色', enum: Role, default: Role.CUSTOMER_SERVICE })
  @IsOptional()
  @IsEnum(Role)
  handlerRole?: Role = Role.CUSTOMER_SERVICE;

  @ApiPropertyOptional({ description: '处理责任人ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  handlerId?: string;

  @ApiPropertyOptional({ description: '处理责任人姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  handlerName?: string;
}
`,

  'order/dto/clarify-service.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ClarifyServiceDto {
  @ApiProperty({ description: '订单ID' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: '服务内容澄清' })
  @IsOptional()
  @IsString()
  serviceScope?: string;

  @ApiPropertyOptional({ description: '是否增加联系次数', default: true })
  @IsOptional()
  @IsBoolean()
  contactCountIncrement?: boolean = true;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsOptional()
  @IsString()
  notes?: string;
}
`,

  // ===== Order Service =====
  'order/service/order.service.ts': `import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { ReportNoShowDto, NoShowParty } from '../dto/report-no-show.dto';
import { ClarifyServiceDto } from '../dto/clarify-service.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums';
import { ListResponseDto } from '../../common/dto/list-response.dto';
import { HousekeeperService } from '../../housekeeper/service/housekeeper.service';
import { AuditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

interface Actor {
  role: Role;
  id: string;
  name: string;
}

interface OrderWithExtra extends Order {
  stalenessHours?: number;
  stalled?: boolean;
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
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return \`HMS-\${y}\${m}\${d}-\${rand}\`;
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
  ) {}

  async create(dto: CreateOrderDto, actor: Actor): Promise<Order> {
    const now = new Date();
    const order = this.orderRepo.create({
      ...dto,
      orderNo: generateOrderNo(),
      status: OrderStatus.DRAFT,
      statusChangedAt: now,
    });
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', saved.id, AuditAction.CREATE, actor.role, actor.id, actor.name, '创建订单');
    return saved;
  }

  async schedule(id: string, scheduledStart: Date, scheduledEnd: Date | null, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    order.scheduledStart = scheduledStart;
    if (scheduledEnd) order.scheduledEnd = scheduledEnd;
    order.status = OrderStatus.SCHEDULED;
    order.statusChangedAt = new Date();
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.STATUS_CHANGE, actor.role, actor.id, actor.name, \`状态变更 DRAFT -> SCHEDULED\`);
    return saved;
  }

  async confirm(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    if (order.status !== OrderStatus.SCHEDULED) {
      throw new BadRequestException(\`仅 SCHEDULED 状态可确认，当前状态: \${order.status}\`);
    }
    const hasScope = order.serviceScope && order.serviceScope.trim().length > 0;
    const isClarified = order.serviceClarificationStatus === 'CLARIFIED';
    if (!hasScope && !isClarified) {
      throw new BadRequestException('确认订单前需补充服务内容(serviceScope)或服务内容已澄清(status=CLARIFIED)');
    }
    order.status = OrderStatus.CONFIRMED;
    order.statusChangedAt = new Date();
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.STATUS_CHANGE, actor.role, actor.id, actor.name, '状态变更 SCHEDULED -> CONFIRMED');
    return saved;
  }

  async startService(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(\`仅 CONFIRMED 状态可开始服务，当前状态: \${order.status}\`);
    }
    order.status = OrderStatus.IN_SERVICE;
    order.statusChangedAt = new Date();
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.STATUS_CHANGE, actor.role, actor.id, actor.name, '状态变更 CONFIRMED -> IN_SERVICE');
    return saved;
  }

  async complete(id: string, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    if (order.status !== OrderStatus.IN_SERVICE) {
      throw new BadRequestException(\`仅 IN_SERVICE 状态可完成，当前状态: \${order.status}\`);
    }
    order.status = OrderStatus.COMPLETED;
    order.statusChangedAt = new Date();
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.STATUS_CHANGE, actor.role, actor.id, actor.name, '状态变更 IN_SERVICE -> COMPLETED');
    return saved;
  }

  async reportNoShow(dto: ReportNoShowDto, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(dto.orderId);
    const now = new Date();
    const targetStatus = dto.noShowParty === NoShowParty.HOUSEKEEPER
      ? OrderStatus.NO_SHOW_BY_HOUSEKEEPER
      : OrderStatus.NO_SHOW_BY_CUSTOMER;
    order.status = targetStatus;
    order.statusChangedAt = now;
    order.noShowReportedAt = now;
    order.noShowReason = dto.noShowReason;
    order.noShowHandlerRole = dto.handlerRole ?? Role.CUSTOMER_SERVICE;
    order.noShowHandlerId = dto.handlerId ?? actor.id;
    order.noShowHandlerName = dto.handlerName ?? actor.name;
    const saved = await this.orderRepo.save(order);
    if (dto.noShowParty === NoShowParty.HOUSEKEEPER) {
      await this.housekeeperService.markNoShow(order.housekeeperId);
    }
    await this.auditService.quickLog('ORDER', dto.orderId, AuditAction.REPORT_NO_SHOW, actor.role, actor.id, actor.name, \`上报爽约 \${dto.noShowParty}, 原因: \${dto.noShowReason}\`);
    return saved;
  }

  async handleNoShow(id: string, resolution: string, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    order.noShowResolution = resolution;
    let nextStatus: OrderStatus;
    const now = new Date();
    const lower = resolution.trim();
    if (lower.includes('换阿姨') || lower.includes('重排')) {
      nextStatus = OrderStatus.SCHEDULED;
    } else if (lower.includes('退单') || lower.includes('取消')) {
      nextStatus = OrderStatus.CANCELLED;
    } else if (lower.includes('补偿') || lower.includes('纠纷') || lower.includes('争议')) {
      nextStatus = OrderStatus.DISPUTED;
      order.disputeOpenedAt = now;
    } else {
      nextStatus = OrderStatus.DISPUTED;
      order.disputeOpenedAt = now;
    }
    const prevStatus = order.status;
    order.status = nextStatus;
    order.statusChangedAt = now;
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.HANDLE_NO_SHOW, actor.role, actor.id, actor.name, \`爽约处理: \${resolution}, \${prevStatus} -> \${nextStatus}\`);
    return saved;
  }

  async clarifyService(dto: ClarifyServiceDto, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(dto.orderId);
    if (dto.serviceScope !== undefined) {
      order.serviceScope = dto.serviceScope;
    }
    if (dto.contactCountIncrement !== false) {
      order.clarificationContactCount = (order.clarificationContactCount ?? 0) + 1;
    }
    const scope = order.serviceScope ?? '';
    if (scope.trim().length > 0) {
      order.serviceClarificationStatus = 'CLARIFIED';
    }
    const saved = await this.orderRepo.save(order);
    const extra = dto.notes ? \`，备注: \${dto.notes}\` : '';
    await this.auditService.quickLog('ORDER', dto.orderId, AuditAction.CLARIFY, actor.role, actor.id, actor.name, \`服务澄清: 联系次数+1, status=\${order.serviceClarificationStatus}\${extra}\`);
    return saved;
  }

  async findAll(query: QueryOrderDto): Promise<ListResponseDto<OrderWithExtra>> {
    const { page = 1, pageSize = 20, status, intakeId, housekeeperId } = query;
    const qb = this.orderRepo.createQueryBuilder('o');
    if (status) qb.andWhere('o.status = :status', { status });
    if (intakeId) qb.andWhere('o.intakeId = :intakeId', { intakeId });
    if (housekeeperId) qb.andWhere('o.housekeeperId = :housekeeperId', { housekeeperId });
    qb.orderBy('o.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    const now = new Date();
    const enriched = list.map((o) => {
      const r: OrderWithExtra = { ...o };
      if (!FINAL_STATUSES.includes(o.status)) {
        const s = calcStaleness(o, now);
        r.stalenessHours = s.stalenessHours;
        r.stalled = s.stalled;
      }
      return r;
    });
    return new ListResponseDto(enriched, total, page, pageSize);
  }

  async findOneEntity(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(\`订单不存在: \${id}\`);
    return order;
  }

  async findOne(id: string): Promise<{ order: Order; auditTrail: any[] }> {
    const order = await this.findOneEntity(id);
    const auditTrail = await this.auditService.findByEntity('ORDER', id);
    return { order, auditTrail };
  }

  async detectTimeoutOrders(): Promise<OrderWithExtra[]> {
    const now = new Date();
    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .where(new Brackets((qb) => {
        const placeholders = FINAL_STATUSES.map((_, i) => \`:s\${i}\`).join(',');
        qb.where(\`o.status NOT IN (\${placeholders})\`);
      }))
      .setParameters(
        FINAL_STATUSES.reduce((acc, s, i) => ({ ...acc, [\`s\${i}\`]: s }), {}),
      )
      .andWhere("o.statusChangedAt <= :threshold", { threshold: new Date(now.getTime() - 72 * 60 * 60 * 1000) })
      .orderBy('o.statusChangedAt', 'ASC')
      .getMany();
    return orders.map((o) => {
      const s = calcStaleness(o, now);
      return { ...o, ...s };
    });
  }

  async update(id: string, dto: UpdateOrderDto, actor: Actor): Promise<Order> {
    const order = await this.findOneEntity(id);
    Object.assign(order, dto);
    const saved = await this.orderRepo.save(order);
    await this.auditService.quickLog('ORDER', id, AuditAction.UPDATE, actor.role, actor.id, actor.name, '更新订单信息');
    return saved;
  }
}
`,

  // ===== Order Controller =====
  'order/controller/order.controller.ts': `import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { ReportNoShowDto } from '../dto/report-no-show.dto';
import { ClarifyServiceDto } from '../dto/clarify-service.dto';
import { Role } from '../../common/enums';

interface ActorHeader {
  'x-actor-role'?: Role;
  'x-actor-id'?: string;
  'x-actor-name'?: string;
}

function extractActor(headers: any) {
  return {
    role: headers['x-actor-role'] ?? Role.CUSTOMER_SERVICE,
    id: headers['x-actor-id'] ?? 'system',
    name: headers['x-actor-name'] ?? 'System',
  };
}

@ApiTags('订单排班 Order')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@Body() dto: CreateOrderDto, @Body() headers: ActorHeader) {
    return this.orderService.create(dto, extractActor(headers));
  }

  @Get()
  @ApiOperation({ summary: '分页查询订单列表（附加超时标记）' })
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  @Get('stuck/timeouts')
  @ApiOperation({ summary: '检测超时订单（>72h 非终态）' })
  detectTimeouts() {
    return this.orderService.detectTimeoutOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询订单详情及审计轨迹' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新订单基本信息' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Body() headers: ActorHeader) {
    return this.orderService.update(id, dto, extractActor(headers));
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: '排班：DRAFT -> SCHEDULED' })
  schedule(
    @Param('id') id: string,
    @Body() body: { scheduledStart: Date; scheduledEnd?: Date },
    @Body() headers: ActorHeader,
  ) {
    return this.orderService.schedule(id, body.scheduledStart, body.scheduledEnd ?? null, extractActor(headers));
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认订单：SCHEDULED -> CONFIRMED' })
  confirm(@Param('id') id: string, @Body() headers: ActorHeader) {
    return this.orderService.confirm(id, extractActor(headers));
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始服务：CONFIRMED -> IN_SERVICE' })
  startService(@Param('id') id: string, @Body() headers: ActorHeader) {
    return this.orderService.startService(id, extractActor(headers));
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成订单：IN_SERVICE -> COMPLETED' })
  complete(@Param('id') id: string, @Body() headers: ActorHeader) {
    return this.orderService.complete(id, extractActor(headers));
  }

  @Post('no-show/report')
  @ApiOperation({ summary: '上报爽约' })
  reportNoShow(@Body() dto: ReportNoShowDto, @Body() headers: ActorHeader) {
    return this.orderService.reportNoShow(dto, extractActor(headers));
  }

  @Post(':id/no-show/handle')
  @ApiOperation({ summary: '处理爽约（换阿姨/退单/补偿 → 变更状态）' })
  handleNoShow(
    @Param('id') id: string,
    @Body() body: { resolution: string },
    @Body() headers: ActorHeader,
  ) {
    return this.orderService.handleNoShow(id, body.resolution, extractActor(headers));
  }

  @Post('clarify-service')
  @ApiOperation({ summary: '服务内容澄清' })
  clarifyService(@Body() dto: ClarifyServiceDto, @Body() headers: ActorHeader) {
    return this.orderService.clarifyService(dto, extractActor(headers));
  }
}
`,

  // ===== Order Module =====
  'order/module/order.module.ts': `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { OrderService } from '../service/order.service';
import { OrderController } from '../controller/order.controller';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';
import { AuditModule } from '../../audit/module/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), HousekeeperModule, AuditModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
`,

  // ===== Quality Entity =====
  'quality/entities/review.entity.ts': `import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReviewStatus } from '../../../common/enums/review-status.enum';
import { Role } from '../../../common/enums';

@Entity('reviews')
@Index('idx_reviews_status', ['status'])
@Index('idx_reviews_housekeeper_id', ['housekeeperId'])
@Index('idx_reviews_is_negative', ['isNegative'])
export class Review extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'intake_id', type: 'uuid', nullable: true })
  intakeId: string;

  @Column({ name: 'housekeeper_id', type: 'uuid' })
  housekeeperId: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 100 })
  customerName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'simple-enum', enum: ReviewStatus, default: ReviewStatus.SUBMITTED })
  status: ReviewStatus;

  @Column({ name: 'is_negative', type: 'boolean' })
  isNegative: boolean;

  @Column({ name: 'assigned_role', type: 'simple-enum', enum: Role, nullable: true })
  assignedRole: Role;

  @Column({ name: 'assigned_id', type: 'varchar', length: 100, nullable: true })
  assignedId: string;

  @Column({ name: 'assigned_name', type: 'varchar', length: 100, nullable: true })
  assignedName: string;

  @Column({ name: 'assigned_at', type: 'datetime', nullable: true })
  assignedAt: Date;

  @Column({ name: 'last_contact_at', type: 'datetime', nullable: true })
  lastContactAt: Date;

  @Column({ name: 'contact_count', type: 'int', default: 0 })
  contactCount: number;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string;

  @Column({ name: 'escalated_at', type: 'datetime', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;

  @Column({ name: 'follow_up_notes', type: 'text', nullable: true })
  followUpNotes: string;
}
`,

  // ===== Quality DTOs =====
  'quality/dto/create-review.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '订单ID' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: '关联客户需求ID' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiProperty({ description: '阿姨ID' })
  @IsNotEmpty()
  @IsUUID()
  housekeeperId: string;

  @ApiProperty({ description: '客户姓名' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: '评分 1-5' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: '评价正文' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'SLA期限(覆盖默认48h)' })
  @IsOptional()
  @IsDateString()
  deadline?: Date;
}
`,

  'quality/dto/query-review.dto.ts': `import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ReviewStatus } from '../../common/enums/review-status.enum';

export class QueryReviewDto extends PaginationDto {
  @ApiPropertyOptional({ description: '评价状态', enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: '是否差评(rating<=3)' })
  @IsOptional()
  @IsBoolean()
  isNegative?: boolean;

  @ApiPropertyOptional({ description: '跟进责任人ID' })
  @IsOptional()
  @IsString()
  assignedId?: string;
}
`,

  'quality/dto/assign-review.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Role } from '../../common/enums';

export class AssignReviewDto {
  @ApiProperty({ description: '评价ID' })
  @IsNotEmpty()
  @IsUUID()
  reviewId: string;

  @ApiPropertyOptional({ description: '跟进责任人角色', enum: Role, default: Role.QUALITY_SUPERVISOR })
  @IsOptional()
  @IsEnum(Role)
  assignedRole?: Role = Role.QUALITY_SUPERVISOR;

  @ApiProperty({ description: '跟进责任人ID' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  assignedId: string;

  @ApiProperty({ description: '跟进责任人姓名' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  assignedName: string;
}
`,

  'quality/dto/followup-review.dto.ts': `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FollowupReviewDto {
  @ApiProperty({ description: '评价ID' })
  @IsNotEmpty()
  @IsUUID()
  reviewId: string;

  @ApiProperty({ description: '跟进备注' })
  @IsNotEmpty()
  @IsString()
  notes: string;

  @ApiPropertyOptional({ description: '是否已联系客户', default: true })
  @IsOptional()
  @IsBoolean()
  contacted?: boolean = true;

  @ApiPropertyOptional({ description: '下一步计划' })
  @IsOptional()
  @IsString()
  nextAction?: string;
}
`,

  'quality/dto/resolve-review.dto.ts': `import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { Role } from '../../common/enums';

export class ResolveReviewDto {
  @ApiProperty({ description: '评价ID' })
  @IsNotEmpty()
  @IsUUID()
  reviewId: string;

  @ApiProperty({ description: '处理方案' })
  @IsNotEmpty()
  @IsString()
  resolution: string;

  @ApiProperty({ description: '处理人角色', enum: Role })
  @IsNotEmpty()
  @IsEnum(Role)
  actorRole: Role;

  @ApiProperty({ description: '处理人ID' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  actorId: string;

  @ApiProperty({ description: '处理人姓名' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  actorName: string;
}
`,

  // ===== Quality Service =====
  'quality/service/quality.service.ts': `import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { QueryReviewDto } from '../dto/query-review.dto';
import { AssignReviewDto } from '../dto/assign-review.dto';
import { FollowupReviewDto } from '../dto/followup-review.dto';
import { ResolveReviewDto } from '../dto/resolve-review.dto';
import { ReviewStatus } from '../../common/enums/review-status.enum';
import { Role } from '../../common/enums';
import { ListResponseDto } from '../../common/dto/list-response.dto';
import { HousekeeperService } from '../../housekeeper/service/housekeeper.service';
import { AuditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

interface Actor {
  role: Role;
  id: string;
  name: string;
}

interface ReviewWithExtra extends Review {
  overdueHours?: number;
}

const FINAL_REVIEW_STATUSES = [ReviewStatus.RESOLVED, ReviewStatus.CLOSED_WITHOUT_RESOLUTION];

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function calcOverdue(review: Review, now: Date): number | null {
  if (!review.deadline) return null;
  if (FINAL_REVIEW_STATUSES.includes(review.status)) return null;
  const deadline = new Date(review.deadline);
  if (deadline >= now) return 0;
  return Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));
}

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly housekeeperService: HousekeeperService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateReviewDto, actor: Actor): Promise<Review> {
    const isNegative = dto.rating <= 3;
    const now = new Date();
    const review = this.reviewRepo.create({
      ...dto,
      isNegative,
      status: isNegative ? ReviewStatus.AWAITING_QUALITY_ASSIGN : ReviewStatus.RESOLVED,
      deadline: isNegative ? (dto.deadline ?? addHours(now, 48)) : null,
      resolvedAt: isNegative ? null : now,
    });
    const saved = await this.reviewRepo.save(review);
    if (!isNegative) {
      await this.housekeeperService.incrementReview(saved.housekeeperId, dto.rating);
    }
    await this.auditService.quickLog('REVIEW', saved.id, AuditAction.CREATE, actor.role, actor.id, actor.name, \`创建评价 rating=\${dto.rating}, isNegative=\${isNegative}, status=\${saved.status}\`);
    return saved;
  }

  async assign(dto: AssignReviewDto, actor: Actor): Promise<Review> {
    const review = await this.findOneEntity(dto.reviewId);
    if (review.status !== ReviewStatus.AWAITING_QUALITY_ASSIGN) {
      throw new BadRequestException(\`仅 AWAITING_QUALITY_ASSIGN 可分配，当前状态: \${review.status}\`);
    }
    const now = new Date();
    review.status = ReviewStatus.QUALITY_FOLLOWING;
    review.assignedRole = dto.assignedRole ?? Role.QUALITY_SUPERVISOR;
    review.assignedId = dto.assignedId;
    review.assignedName = dto.assignedName;
    review.assignedAt = now;
    const saved = await this.reviewRepo.save(review);
    await this.auditService.quickLog('REVIEW', dto.reviewId, AuditAction.ASSIGN, actor.role, actor.id, actor.name, \`分配责任人: \${dto.assignedRole}/\${dto.assignedName}\`);
    return saved;
  }

  async followUp(dto: FollowupReviewDto, actor: Actor): Promise<Review> {
    const review = await this.findOneEntity(dto.reviewId);
    if (review.status !== ReviewStatus.QUALITY_FOLLOWING) {
      throw new BadRequestException(\`仅 QUALITY_FOLLOWING 可跟进，当前状态: \${review.status}\`);
    }
    const now = new Date();
    review.contactCount = (review.contactCount ?? 0) + 1;
    if (dto.contacted !== false) {
      review.lastContactAt = now;
    }
    review.followUpNotes = dto.notes;
    const overdue = calcOverdue(review, now);
    if (overdue !== null && overdue > 0) {
      review.status = ReviewStatus.ESCALATED;
      review.escalatedAt = now;
      review.escalationReason = review.escalationReason ?? \`跟进中已超期 \${overdue}h，自动升级\`;
    }
    const saved = await this.reviewRepo.save(review);
    const extra = dto.nextAction ? \`，下一步: \${dto.nextAction}\` : '';
    await this.auditService.quickLog('REVIEW', dto.reviewId, AuditAction.FOLLOW_UP, actor.role, actor.id, actor.name, \`跟进记录: \${dto.notes}，联系次数=\${saved.contactCount}\${extra}\`);
    return saved;
  }

  async escalate(id: string, reason: string, actor: Actor): Promise<Review> {
    const review = await this.findOneEntity(id);
    const now = new Date();
    review.status = ReviewStatus.ESCALATED;
    review.escalatedAt = now;
    review.escalationReason = reason;
    const saved = await this.reviewRepo.save(review);
    await this.auditService.quickLog('REVIEW', id, AuditAction.ESCALATE, actor.role, actor.id, actor.name, \`升级原因: \${reason}\`);
    return saved;
  }

  async resolve(dto: ResolveReviewDto, actor: Actor): Promise<Review> {
    const review = await this.findOneEntity(dto.reviewId);
    const now = new Date();
    review.status = ReviewStatus.RESOLVED;
    review.resolvedAt = now;
    review.resolution = dto.resolution;
    const saved = await this.reviewRepo.save(review);
    await this.housekeeperService.incrementReview(saved.housekeeperId, review.rating);
    await this.auditService.quickLog('REVIEW', dto.reviewId, AuditAction.RESOLVE, dto.actorRole, dto.actorId, dto.actorName, \`处理方案: \${dto.resolution}\`);
    return saved;
  }

  async closeWithoutResolution(id: string, reason: string, actor: Actor): Promise<Review> {
    const review = await this.findOneEntity(id);
    review.status = ReviewStatus.CLOSED_WITHOUT_RESOLUTION;
    review.resolvedAt = new Date();
    review.resolution = \`未解决关闭: \${reason}\`;
    const saved = await this.reviewRepo.save(review);
    await this.auditService.quickLog('REVIEW', id, AuditAction.CLOSE_WITHOUT_RESOLUTION, actor.role, actor.id, actor.name, \`关闭原因: \${reason}\`);
    return saved;
  }

  async findAll(query: QueryReviewDto): Promise<ListResponseDto<ReviewWithExtra>> {
    const { page = 1, pageSize = 20, status, isNegative, assignedId } = query;
    const where: any = {};
    if (status !== undefined) where.status = status;
    if (isNegative !== undefined) where.isNegative = isNegative;
    if (assignedId !== undefined) where.assignedId = assignedId;
    const [list, total] = await this.reviewRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const now = new Date();
    const enriched = list.map((r) => {
      const o: ReviewWithExtra = { ...r };
      const h = calcOverdue(r, now);
      if (h !== null && h > 0) o.overdueHours = h;
      return o;
    });
    return new ListResponseDto(enriched, total, page, pageSize);
  }

  async findPendingReviews(): Promise<ReviewWithExtra[]> {
    const now = new Date();
    const list = await this.reviewRepo.find({
      where: { status: In([ReviewStatus.AWAITING_QUALITY_ASSIGN, ReviewStatus.QUALITY_FOLLOWING]) },
      order: { createdAt: 'ASC' },
    });
    return list
      .map((r) => {
        const h = calcOverdue(r, now);
        const o: ReviewWithExtra = { ...r };
        if (h !== null && h > 0) o.overdueHours = h;
        return o;
      })
      .filter((r) => (r.overdueHours ?? 0) > 0);
  }

  async findOneEntity(id: string): Promise<Review> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(\`评价不存在: \${id}\`);
    return r;
  }

  async findOne(id: string): Promise<{ review: Review; auditTrail: any[] }> {
    const review = await this.findOneEntity(id);
    const auditTrail = await this.auditService.findByEntity('REVIEW', id);
    return { review, auditTrail };
  }
}
`,

  // ===== Quality Controller =====
  'quality/controller/quality.controller.ts': `import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QualityService } from '../service/quality.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { QueryReviewDto } from '../dto/query-review.dto';
import { AssignReviewDto } from '../dto/assign-review.dto';
import { FollowupReviewDto } from '../dto/followup-review.dto';
import { ResolveReviewDto } from '../dto/resolve-review.dto';
import { Role } from '../../common/enums';

interface ActorHeader {
  'x-actor-role'?: Role;
  'x-actor-id'?: string;
  'x-actor-name'?: string;
}

function extractActor(headers: any) {
  return {
    role: headers['x-actor-role'] ?? Role.QUALITY_SUPERVISOR,
    id: headers['x-actor-id'] ?? 'system',
    name: headers['x-actor-name'] ?? 'System',
  };
}

@ApiTags('质检评价 Quality')
@Controller('quality/reviews')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  @ApiOperation({ summary: '创建评价（差评自动进入待分配+48h SLA）' })
  create(@Body() dto: CreateReviewDto, @Body() headers: ActorHeader) {
    return this.qualityService.create(dto, extractActor(headers));
  }

  @Get()
  @ApiOperation({ summary: '分页查询评价（附加逾期小时数）' })
  findAll(@Query() query: QueryReviewDto) {
    return this.qualityService.findAll(query);
  }

  @Get('pending')
  @ApiOperation({ summary: '待跟进差评（已逾期>0h）' })
  findPending() {
    return this.qualityService.findPendingReviews();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询评价详情及审计轨迹' })
  findOne(@Param('id') id: string) {
    return this.qualityService.findOne(id);
  }

  @Post('assign')
  @ApiOperation({ summary: '分配差评跟进人' })
  assign(@Body() dto: AssignReviewDto, @Body() headers: ActorHeader) {
    return this.qualityService.assign(dto, extractActor(headers));
  }

  @Post('follow-up')
  @ApiOperation({ summary: '跟进差评（自动检测逾期升级）' })
  followUp(@Body() dto: FollowupReviewDto, @Body() headers: ActorHeader) {
    return this.qualityService.followUp(dto, extractActor(headers));
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: '手动升级差评' })
  escalate(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Body() headers: ActorHeader,
  ) {
    return this.qualityService.escalate(id, body.reason, extractActor(headers));
  }

  @Post('resolve')
  @ApiOperation({ summary: '解决差评（更新阿姨评分）' })
  resolve(@Body() dto: ResolveReviewDto, @Body() headers: ActorHeader) {
    return this.qualityService.resolve(dto, extractActor(headers));
  }

  @Post(':id/close')
  @ApiOperation({ summary: '无解决方案关闭' })
  close(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Body() headers: ActorHeader,
  ) {
    return this.qualityService.closeWithoutResolution(id, body.reason, extractActor(headers));
  }
}
`,

  // ===== Quality Module =====
  'quality/module/quality.module.ts': `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../entities/review.entity';
import { QualityService } from '../service/quality.service';
import { QualityController } from '../controller/quality.controller';
import { HousekeeperModule } from '../../housekeeper/module/housekeeper.module';
import { AuditModule } from '../../audit/module/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), HousekeeperModule, AuditModule],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
`,
};

// AuditAction enum stub for TypeScript reference
const auditActionPath = path.join(base, 'common/enums/audit-action.enum.ts');
if (!fs.existsSync(auditActionPath)) {
  const auditContent = `export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  REPORT_NO_SHOW = 'REPORT_NO_SHOW',
  HANDLE_NO_SHOW = 'HANDLE_NO_SHOW',
  CLARIFY = 'CLARIFY',
  ASSIGN = 'ASSIGN',
  FOLLOW_UP = 'FOLLOW_UP',
  ESCALATE = 'ESCALATE',
  RESOLVE = 'RESOLVE',
  CLOSE_WITHOUT_RESOLUTION = 'CLOSE_WITHOUT_RESOLUTION',
}
`;
  fs.writeFileSync(auditActionPath, auditContent);
  console.log('Created stub:', auditActionPath);
  const enumIdx = path.join(base, 'common/enums/index.ts');
  let idx = fs.readFileSync(enumIdx, 'utf8');
  if (!idx.includes('audit-action')) {
    idx += "export * from './audit-action.enum';\n";
    fs.writeFileSync(enumIdx, idx);
    console.log('Updated enums index.ts');
  }
}

let count = 0;
for (const [rel, content] of Object.entries(files)) {
  const full = path.join(base, rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content);
  console.log('Written:', rel);
  count++;
}
console.log('Total files written:', count);
