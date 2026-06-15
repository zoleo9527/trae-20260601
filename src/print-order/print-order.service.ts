import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { PrintOrder } from './entities/print-order.entity';
import { InstallationAssignment } from './entities/installation-assignment.entity';
import { PhotoReturn, PhotoReturnStatus } from './entities/photo-return.entity';
import { OrderNote, NoteType } from './entities/order-note.entity';
import { InstallationTask, InstallationTaskStatus, TaskStuckLevel } from './entities/installation-task.entity';
import { CreatePrintOrderDto } from './dto/create-print-order.dto';
import { UpdatePrintOrderDto } from './dto/update-print-order.dto';
import { PrintOrderQueryDto } from './dto/print-order-query.dto';
import { AssignInstallationDto } from './dto/assign-installation.dto';
import { SubmitPhotoReturnDto } from './dto/submit-photo-return.dto';
import { AddOrderNoteDto } from './dto/add-order-note.dto';
import { ReviewPhotoReturnDto } from './dto/review-photo-return.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitTaskPhotoDto } from './dto/submit-task-photo.dto';
import { ReviewTaskPhotoDto } from './dto/review-task-photo.dto';
import { AddTaskSupplementDto } from './dto/add-task-supplement.dto';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PrintOrderStatus } from '../common/enums/print-order-status.enum';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { OperationLogService } from '../common/services/operation-log.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PrintOrderService {
  constructor(
    @InjectRepository(PrintOrder)
    private readonly orderRepo: Repository<PrintOrder>,
    @InjectRepository(InstallationAssignment)
    private readonly assignmentRepo: Repository<InstallationAssignment>,
    @InjectRepository(PhotoReturn)
    private readonly photoReturnRepo: Repository<PhotoReturn>,
    @InjectRepository(OrderNote)
    private readonly noteRepo: Repository<OrderNote>,
    @InjectRepository(InstallationTask)
    private readonly taskRepo: Repository<InstallationTask>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly logService: OperationLogService,
  ) {}

  private generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PH${y}${m}${d}${rand}`;
  }

  async create(dto: CreatePrintOrderDto, receptionist: User) {
    const orderNo = this.generateOrderNo();

    const designer = dto.designerId
      ? await this.userRepo.findOne({ where: { id: dto.designerId, role: UserRole.DESIGNER } })
      : null;

    const order = this.orderRepo.create({
      ...dto,
      orderNo,
      receptionist,
      designer,
      status: PrintOrderStatus.PENDING_DESIGN,
    });

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      saved.id,
      'create',
      receptionist,
      null,
      saved,
      { orderNo: saved.orderNo, projectName: saved.projectName },
    );

    return saved;
  }

  async findAll(query: PrintOrderQueryDto, user: User) {
    const { page = 1, pageSize = 20, status, priority, keyword, designerId, installLeaderId } = query;
    
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.receptionist', 'r')
      .leftJoinAndSelect('o.designer', 'd')
      .leftJoinAndSelect('o.printOperator', 'po')
      .leftJoinAndSelect('o.installLeader', 'il');

    if (user.role === UserRole.DESIGNER) {
      qb.andWhere('(d.id = :uid OR d.id IS NULL)', { uid: user.id });
    }
    if (user.role === UserRole.PRINT_OPERATOR) {
      qb.andWhere('(po.id = :uid OR po.id IS NULL)', { uid: user.id });
    }
    if (user.role === UserRole.INSTALL_LEADER) {
      qb.andWhere('(il.id = :uid OR il.id IS NULL)', { uid: user.id });
    }

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('o.priority = :priority', { priority });
    }
    if (designerId) {
      qb.andWhere('d.id = :did', { did: designerId });
    }
    if (installLeaderId) {
      qb.andWhere('il.id = :iid', { iid: installLeaderId });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((sq) => {
          sq.where('o.customerName LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.customerPhone LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.orderNo LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.projectName LIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }

    qb.addSelect(
      "CASE o.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END",
      'priority_order',
    );
    qb.orderBy('priority_order', 'ASC');
    qb.addOrderBy('o.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'receptionist',
        'designer',
        'printOperator',
        'installLeader',
        'installationAssignments',
        'photoReturns',
        'notes',
        'notes.createdBy',
      ],
      order: {
        installationAssignments: { createdAt: 'DESC' },
        photoReturns: { createdAt: 'DESC' },
        notes: { createdAt: 'DESC' },
      },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }

    return order;
  }

  async update(id: string, dto: UpdatePrintOrderDto, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if ((dto as any).status !== undefined) {
      throw new BusinessException(
        ErrorCode.AUTH_FORBIDDEN,
        '禁止通过通用更新接口直接修改状态，请通过对应流程接口操作',
      );
    }

    if (dto.designerId !== undefined) {
      order.designer = dto.designerId
        ? await this.userRepo.findOne({ where: { id: dto.designerId, role: UserRole.DESIGNER } })
        : null;
    }
    if (dto.printOperatorId !== undefined) {
      order.printOperator = dto.printOperatorId
        ? await this.userRepo.findOne({ where: { id: dto.printOperatorId, role: UserRole.PRINT_OPERATOR } })
        : null;
    }
    if (dto.installLeaderId !== undefined) {
      order.installLeader = dto.installLeaderId
        ? await this.userRepo.findOne({ where: { id: dto.installLeaderId, role: UserRole.INSTALL_LEADER } })
        : null;
    }

    if (dto.customerName !== undefined) order.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) order.customerPhone = dto.customerPhone;
    if (dto.projectName !== undefined) order.projectName = dto.projectName;
    if (dto.contentDescription !== undefined) order.contentDescription = dto.contentDescription;
    if (dto.designNotes !== undefined) order.designNotes = dto.designNotes;
    if (dto.printNotes !== undefined) order.printNotes = dto.printNotes;
    if (dto.priority !== undefined) order.priority = dto.priority;
    if (dto.totalPrice !== undefined) order.totalPrice = dto.totalPrice;
    if (dto.expectedDelivery !== undefined) order.expectedDelivery = new Date(dto.expectedDelivery);

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { changes: Object.keys(dto) },
    );

    return saved;
  }

  async assignDesigner(id: string, designerId: string, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.PENDING_DESIGN) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可分配设计师',
      );
    }

    const designer = await this.userRepo.findOne({
      where: { id: designerId, role: UserRole.DESIGNER },
    });
    if (!designer) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '设计师不存在');
    }

    order.designer = designer;
    order.status = PrintOrderStatus.DESIGNING;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'assign_designer', designerName: designer.name },
    );

    return saved;
  }

  async submitDesign(id: string, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.DESIGNING) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有设计中状态可提交喷绘',
      );
    }

    order.status = PrintOrderStatus.PENDING_PRINT;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'submit_design' },
    );

    return saved;
  }

  async startPrint(id: string, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.PENDING_PRINT) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可开始喷绘',
      );
    }

    if (operator.role === UserRole.PRINT_OPERATOR) {
      order.printOperator = operator;
    }

    order.status = PrintOrderStatus.PRINTING;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'start_print' },
    );

    return saved;
  }

  async completePrint(id: string, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.PRINTING) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有喷绘中状态可完成喷绘',
      );
    }

    order.status = PrintOrderStatus.PENDING_INSTALL;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'complete_print' },
    );

    return saved;
  }

  async assignInstallation(id: string, dto: AssignInstallationDto, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    const validStatuses = [
      PrintOrderStatus.PENDING_INSTALL,
      PrintOrderStatus.INSTALL_ASSIGNED,
      PrintOrderStatus.PHOTO_REJECTED,
    ];
    if (!validStatuses.includes(order.status)) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可派工',
      );
    }

    const installLeader = await this.userRepo.findOne({
      where: { id: dto.installLeaderId, role: UserRole.INSTALL_LEADER },
    });
    if (!installLeader) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '安装队长不存在');
    }

    try {
      await this.assignmentRepo.update(
        { order: { id }, isActive: true },
        { isActive: false },
      );
    } catch (_) {}
    let assignment: InstallationAssignment | null = null;
    try {
      assignment = this.assignmentRepo.create({
        order,
        installLeader,
        installTime: dto.installTime ? new Date(dto.installTime) : null,
        installAddress: dto.installAddress,
        assignmentNotes: dto.assignmentNotes,
        assignedBy: operator,
        teamMembers: dto.teamMembers,
        isActive: true,
      });
      await this.assignmentRepo.save(assignment);
    } catch (e) {
      console.warn('[旧派工表写入失败，继续流程]', e.message);
    }

    order.installLeader = installLeader;
    order.status = PrintOrderStatus.INSTALL_ASSIGNED;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      {
        action: 'assign_installation',
        installLeaderName: installLeader.name,
        assignmentId: assignment?.id,
      },
    );

    return { order: saved, assignment };
  }

  async startInstallation(id: string, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.INSTALL_ASSIGNED) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有已派工状态可开始安装',
      );
    }

    order.status = PrintOrderStatus.INSTALLING;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'start_installation' },
    );

    return saved;
  }

  async submitPhotoReturn(id: string, dto: SubmitPhotoReturnDto, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    const validStatuses = [
      PrintOrderStatus.INSTALLING,
      PrintOrderStatus.PHOTO_REJECTED,
    ];
    if (!validStatuses.includes(order.status)) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可提交照片回传',
      );
    }

    const photoReturn = this.photoReturnRepo.create({
      order,
      photoUrls: dto.photoUrls,
      returnNotes: dto.returnNotes,
      submittedBy: operator,
      status: PhotoReturnStatus.PENDING,
    });
    await this.photoReturnRepo.save(photoReturn);

    order.status = PrintOrderStatus.PHOTO_RETURNED;

    const saved = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      {
        action: 'submit_photo_return',
        photoReturnId: photoReturn.id,
        photoCount: dto.photoUrls.length,
      },
    );

    return { order: saved, photoReturn };
  }

  async reviewPhotoReturn(
    orderId: string,
    photoReturnId: string,
    approved: boolean,
    dto: ReviewPhotoReturnDto,
    operator: User,
  ) {
    const order = await this.findOne(orderId);
    const oldValue = { ...order };

    if (order.status !== PrintOrderStatus.PHOTO_RETURNED) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可审核照片回传',
      );
    }

    const photoReturn = await this.photoReturnRepo.findOne({
      where: { id: photoReturnId },
      relations: ['order'],
    });
    if (!photoReturn) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '照片回传记录不存在');
    }
    if (photoReturn.status !== PhotoReturnStatus.PENDING) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '该照片回传已审核',
      );
    }

    photoReturn.reviewNotes = dto.reviewNotes;
    photoReturn.reviewedBy = operator;
    photoReturn.reviewedAt = new Date();

    if (approved) {
      photoReturn.status = PhotoReturnStatus.APPROVED;
      order.status = PrintOrderStatus.COMPLETED;
      order.completedAt = new Date();
    } else {
      photoReturn.status = PhotoReturnStatus.REJECTED;
      photoReturn.rejectReason = dto.rejectReason;
      order.status = PrintOrderStatus.PHOTO_REJECTED;

      if (dto.rejectReason) {
        const note = this.noteRepo.create({
          order,
          noteType: NoteType.REJECT_REASON,
          content: dto.rejectReason,
          createdBy: operator,
          metadata: { photoReturnId, source: 'photo_reject' },
        });
        await this.noteRepo.save(note);
      }
    }

    await this.photoReturnRepo.save(photoReturn);
    const savedOrder = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      orderId,
      'update',
      operator,
      oldValue,
      savedOrder,
      {
        action: approved ? 'approve_photo' : 'reject_photo',
        photoReturnId,
        approved,
        ...(approved
          ? { reviewNotes: dto.reviewNotes }
          : { rejectReason: dto.rejectReason, reviewNotes: dto.reviewNotes }),
      },
    );

    return { order: savedOrder, photoReturn };
  }

  async addNote(id: string, dto: AddOrderNoteDto, operator: User) {
    const order = await this.findOne(id);

    const note = this.noteRepo.create({
      order,
      noteType: dto.noteType || NoteType.GENERAL,
      content: dto.content,
      createdBy: operator,
      metadata: dto.metadata,
    });

    const saved = await this.noteRepo.save(note);

    await this.logService.record(
      'PrintOrder',
      id,
      'update',
      operator,
      null,
      saved,
      { action: 'add_note', noteType: saved.noteType, contentPreview: dto.content.slice(0, 50) },
    );

    return saved;
  }

  async getNotes(id: string, page = 1, pageSize = 20) {
    await this.findOne(id);

    const [items, total] = await this.noteRepo.findAndCount({
      where: { order: { id } },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return { items, total, page, pageSize };
  }

  async getOperationLogs(id: string, page = 1, pageSize = 20) {
    await this.findOne(id);
    return this.logService.findByEntity('PrintOrder', id, page, pageSize);
  }

  async getStatusFlowConfig() {
    return {
      [PrintOrderStatus.PENDING_DESIGN]: {
        label: '待设计',
        next: [PrintOrderStatus.DESIGNING, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.DESIGNER,
      },
      [PrintOrderStatus.DESIGNING]: {
        label: '设计中',
        next: [PrintOrderStatus.PENDING_PRINT, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.DESIGNER,
      },
      [PrintOrderStatus.PENDING_PRINT]: {
        label: '待喷绘',
        next: [PrintOrderStatus.PRINTING, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.PRINT_OPERATOR,
      },
      [PrintOrderStatus.PRINTING]: {
        label: '喷绘中',
        next: [PrintOrderStatus.PENDING_INSTALL, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.PRINT_OPERATOR,
      },
      [PrintOrderStatus.PENDING_INSTALL]: {
        label: '待安装派工',
        next: [PrintOrderStatus.INSTALL_ASSIGNED, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.MANAGER,
      },
      [PrintOrderStatus.INSTALL_ASSIGNED]: {
        label: '已派工待安装',
        next: [PrintOrderStatus.INSTALLING, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.INSTALL_LEADER,
      },
      [PrintOrderStatus.INSTALLING]: {
        label: '安装中',
        next: [PrintOrderStatus.PHOTO_RETURNED, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.INSTALL_LEADER,
      },
      [PrintOrderStatus.PENDING_PHOTO]: {
        label: '待照片回传',
        next: [PrintOrderStatus.PHOTO_RETURNED, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.INSTALL_LEADER,
      },
      [PrintOrderStatus.PHOTO_RETURNED]: {
        label: '已回传待验收',
        next: [PrintOrderStatus.COMPLETED, PrintOrderStatus.PHOTO_REJECTED],
        responsibleRole: UserRole.MANAGER,
      },
      [PrintOrderStatus.PHOTO_REJECTED]: {
        label: '照片被退回',
        next: [PrintOrderStatus.INSTALL_ASSIGNED, PrintOrderStatus.PHOTO_RETURNED, PrintOrderStatus.CANCELLED],
        responsibleRole: UserRole.INSTALL_LEADER,
      },
      [PrintOrderStatus.COMPLETED]: {
        label: '已完成',
        next: [],
        responsibleRole: null,
      },
      [PrintOrderStatus.CANCELLED]: {
        label: '已取消',
        next: [],
        responsibleRole: null,
      },
    };
  }

  async createInstallationTask(orderId: string, dto: CreateTaskDto, operator: User) {
    const order = await this.findOne(orderId);
    const oldValue = { ...order };

    const validStatuses = [
      PrintOrderStatus.PENDING_INSTALL,
      PrintOrderStatus.INSTALL_ASSIGNED,
      PrintOrderStatus.PHOTO_REJECTED,
    ];
    if (!validStatuses.includes(order.status)) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可创建安装任务',
      );
    }

    const installLeader = await this.userRepo.findOne({
      where: { id: dto.installLeaderId, role: UserRole.INSTALL_LEADER },
    });
    if (!installLeader) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '安装队长不存在');
    }

    await this.taskRepo.update(
      { orderId, isActive: true },
      { isActive: false },
    );

    const lastTask = await this.taskRepo.findOne({
      where: { orderId },
      order: { taskRound: 'DESC' },
    });
    const nextRound = lastTask ? lastTask.taskRound + 1 : 1;

    const task = this.taskRepo.create({
      orderId,
      taskRound: nextRound,
      installLeader,
      installLeaderId: installLeader.id,
      installTime: dto.installTime ? new Date(dto.installTime) : null,
      installAddress: dto.installAddress,
      teamMembers: dto.teamMembers,
      assignmentNotes: dto.assignmentNotes,
      assignedBy: operator,
      status: InstallationTaskStatus.ASSIGNED,
      isActive: true,
      supplementNotes: [],
      stuckLevel: TaskStuckLevel.NORMAL,
    });
    const savedTask = await this.taskRepo.save(task);

    try {
      await this.assignmentRepo.update(
        { order: { id: orderId }, isActive: true },
        { isActive: false },
      );
    } catch (_) {}
    try {
      const assignment = this.assignmentRepo.create({
        order,
        installLeader,
        installTime: dto.installTime ? new Date(dto.installTime) : null,
        installAddress: dto.installAddress,
        assignmentNotes: dto.assignmentNotes,
        assignedBy: operator,
        teamMembers: dto.teamMembers,
        isActive: true,
      });
      await this.assignmentRepo.save(assignment);
    } catch (e) {
      console.warn('[兼容旧派工表写入失败，继续流程]', e.message);
    }

    order.installLeader = installLeader;
    order.status = PrintOrderStatus.INSTALL_ASSIGNED;
    const savedOrder = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      orderId,
      'update',
      operator,
      oldValue,
      savedOrder,
      {
        action: 'create_install_task',
        installLeaderName: installLeader.name,
        taskId: savedTask.id,
        taskRound: nextRound,
      },
    );

    return { order: savedOrder, task: savedTask };
  }

  async startInstallationTask(taskId: string, operator: User) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '安装任务不存在');
    }
    if (task.status !== InstallationTaskStatus.ASSIGNED) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有已派工状态可开始安装',
      );
    }

    const order = await this.findOne(task.orderId);
    const oldValue = { ...order };

    task.status = InstallationTaskStatus.IN_PROGRESS;
    const savedTask = await this.taskRepo.save(task);

    order.status = PrintOrderStatus.INSTALLING;
    const savedOrder = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      task.orderId,
      'update',
      operator,
      oldValue,
      savedOrder,
      { action: 'start_install_task', taskId },
    );

    return { order: savedOrder, task: savedTask };
  }

  async submitTaskPhoto(taskId: string, dto: SubmitTaskPhotoDto, operator: User) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '安装任务不存在');
    }
    const validTaskStatuses = [
      InstallationTaskStatus.IN_PROGRESS,
      InstallationTaskStatus.PHOTO_REJECTED,
    ];
    if (!validTaskStatuses.includes(task.status)) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前任务状态不可提交照片回传',
      );
    }

    const order = await this.findOne(task.orderId);
    const oldValue = { ...order };

    task.photoUrls = dto.photoUrls;
    task.returnNotes = dto.returnNotes;
    task.submittedBy = operator;
    task.submittedAt = new Date();
    task.status = InstallationTaskStatus.PHOTO_SUBMITTED;
    const savedTask = await this.taskRepo.save(task);

    try {
      const photoReturn = this.photoReturnRepo.create({
        order,
        photoUrls: dto.photoUrls,
        returnNotes: dto.returnNotes,
        submittedBy: operator,
        status: PhotoReturnStatus.PENDING,
      });
      await this.photoReturnRepo.save(photoReturn);
    } catch (e) {
      console.warn('[兼容旧照片回传表写入失败，继续]', e.message);
    }

    order.status = PrintOrderStatus.PHOTO_RETURNED;
    const savedOrder = await this.orderRepo.save(order);

    await this.logService.record(
      'PrintOrder',
      task.orderId,
      'update',
      operator,
      oldValue,
      savedOrder,
      {
        action: 'submit_task_photo',
        taskId,
        photoCount: dto.photoUrls.length,
      },
    );

    return { order: savedOrder, task: savedTask };
  }

  async reviewTaskPhoto(
    taskId: string,
    approved: boolean,
    dto: ReviewTaskPhotoDto,
    operator: User,
  ) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '安装任务不存在');
    }
    if (task.status !== InstallationTaskStatus.PHOTO_SUBMITTED) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前任务状态不可审核照片',
      );
    }

    const order = await this.findOne(task.orderId);
    const oldValue = { ...order };

    task.reviewNotes = dto.reviewNotes;
    task.reviewedBy = operator;
    task.reviewedAt = new Date();

    if (approved) {
      task.status = InstallationTaskStatus.PHOTO_APPROVED;
      task.completedAt = new Date();
      order.status = PrintOrderStatus.COMPLETED;
      order.completedAt = new Date();
    } else {
      task.status = InstallationTaskStatus.PHOTO_REJECTED;
      task.rejectReason = dto.rejectReason;
      order.status = PrintOrderStatus.PHOTO_REJECTED;

      if (dto.rejectReason) {
        try {
          const note = this.noteRepo.create({
            order,
            noteType: NoteType.REJECT_REASON,
            content: dto.rejectReason,
            createdBy: operator,
            metadata: { taskId, source: 'task_photo_reject' },
          });
          await this.noteRepo.save(note);
        } catch (e) {
          console.warn('[兼容旧备注表(退回)写入失败，继续]', e.message);
        }
      }
    }

    const savedTask = await this.taskRepo.save(task);
    const savedOrder = await this.orderRepo.save(order);

    if (task.photoUrls?.length) {
      try {
        const pendingPhoto = await this.photoReturnRepo.findOne({
          where: { status: PhotoReturnStatus.PENDING },
          relations: ['order'],
          order: { createdAt: 'DESC' },
        });
        if (pendingPhoto && pendingPhoto.order?.id === task.orderId) {
          pendingPhoto.reviewNotes = dto.reviewNotes;
          pendingPhoto.reviewedBy = operator;
          pendingPhoto.reviewedAt = new Date();
          pendingPhoto.status = approved ? PhotoReturnStatus.APPROVED : PhotoReturnStatus.REJECTED;
          pendingPhoto.rejectReason = dto.rejectReason;
          await this.photoReturnRepo.save(pendingPhoto);
        }
      } catch (e) {
        console.warn('[兼容旧照片回传表审核更新失败，继续]', e.message);
      }
    }

    await this.logService.record(
      'PrintOrder',
      task.orderId,
      'update',
      operator,
      oldValue,
      savedOrder,
      {
        action: approved ? 'approve_task_photo' : 'reject_task_photo',
        taskId,
        approved,
        ...(approved
          ? { reviewNotes: dto.reviewNotes }
          : { rejectReason: dto.rejectReason, reviewNotes: dto.reviewNotes }),
      },
    );

    return { order: savedOrder, task: savedTask };
  }

  async addTaskSupplement(taskId: string, dto: AddTaskSupplementDto, operator: User) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '安装任务不存在');
    }

    const order = await this.findOne(task.orderId);

    const supplements = task.supplementNotes || [];
    supplements.unshift({
      id: randomUUID(),
      content: dto.content,
      authorName: operator.name,
      authorId: operator.id,
      authorRole: operator.role,
      createdAt: new Date(),
    });
    task.supplementNotes = supplements;
    const savedTask = await this.taskRepo.save(task);

    try {
      const note = this.noteRepo.create({
        order,
        noteType: NoteType.SUPPLEMENT,
        content: dto.content,
        createdBy: operator,
        metadata: { taskId, source: 'task_supplement' },
      });
      await this.noteRepo.save(note);
    } catch (e) {
      console.warn('[兼容旧备注表(补充)写入失败，继续]', e.message);
    }

    await this.logService.record(
      'PrintOrder',
      task.orderId,
      'update',
      operator,
      null,
      savedTask,
      { action: 'task_supplement', taskId, contentPreview: dto.content.slice(0, 50) },
    );

    return savedTask;
  }

  async findActiveTaskByOrder(orderId: string) {
    return this.taskRepo.findOne({
      where: { orderId, isActive: true },
      relations: ['installLeader', 'assignedBy', 'submittedBy', 'reviewedBy'],
    });
  }

  async findTasksByOrder(orderId: string) {
    return this.taskRepo.find({
      where: { orderId },
      relations: ['installLeader', 'assignedBy', 'submittedBy', 'reviewedBy'],
      order: { taskRound: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneTask(taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['installLeader', 'assignedBy', 'submittedBy', 'reviewedBy'],
    });
    if (!task) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND, '安装任务不存在');
    }
    return task;
  }

  async refreshTaskStuckStatus() {
    const now = new Date();
    const thresholds: Record<string, { warning: number; danger: number; hint: string }> = {
      [InstallationTaskStatus.ASSIGNED]: {
        warning: 60, danger: 120,
        hint: '已派工但安装队未开工',
      },
      [InstallationTaskStatus.IN_PROGRESS]: {
        warning: 240, danger: 480,
        hint: '安装超过预期时长',
      },
      [InstallationTaskStatus.PHOTO_SUBMITTED]: {
        warning: 60, danger: 120,
        hint: '照片回传后无人验收',
      },
      [InstallationTaskStatus.PHOTO_REJECTED]: {
        warning: 120, danger: 240,
        hint: '照片被退回，责任不清',
      },
    };

    const activeTasks = await this.taskRepo.find({
      where: { isActive: true },
    });

    for (const task of activeTasks) {
      const config = thresholds[task.status];
      if (!config) continue;

      const minutes = Math.round(
        (now.getTime() - new Date(task.updatedAt).getTime()) / 60000,
      );
      task.stuckMinutes = minutes;

      if (minutes >= config.danger) {
        task.stuckLevel = TaskStuckLevel.DANGER;
        task.stuckHint = config.hint;
      } else if (minutes >= config.warning) {
        task.stuckLevel = TaskStuckLevel.WARNING;
        task.stuckHint = config.hint;
      } else {
        task.stuckLevel = TaskStuckLevel.NORMAL;
        task.stuckHint = null;
      }

      await this.taskRepo.save(task);
    }

    return activeTasks.length;
  }

  async getMyTasks(user: User, page = 1, pageSize = 30) {
    if (user.role !== UserRole.INSTALL_LEADER) {
      return { items: [], total: 0, page, pageSize };
    }
    const [items, total] = await this.taskRepo.findAndCount({
      where: { installLeaderId: user.id },
      order: { isActive: 'DESC', stuckLevel: 'ASC', updatedAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { items, total, page, pageSize };
  }
}
