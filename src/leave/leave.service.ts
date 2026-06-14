import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryStore } from '../common/store/in-memory.store';
import { LeaveRequest, LeaveStatus, LeaveType } from '../common/types/leave.type';
import { User, UserRole } from '../common/types/user.type';
import { OperationLogService } from '../common/services/operation-log.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import {
  CreateLeaveRequestDto,
  UpdateLeaveMaterialDto,
  ReviewLeaveDto,
  UrgeLeaveDto,
  QueryLeaveListDto,
} from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logService: OperationLogService,
    private readonly idemService: IdempotencyService,
  ) {}

  create(dto: CreateLeaveRequestDto, teacher: User): LeaveRequest {
    const existing = this.idemService.checkLeave(dto.idempotencyKey);
    if (existing) {
      return existing;
    }

    const affairsUsers = this.store.findUsersByRole(UserRole.AFFAIRS);
    if (affairsUsers.length === 0) {
      throw new BadRequestException('系统中暂无教务老师，无法分配审批人');
    }
    const handler = affairsUsers[0];
    const now = new Date().toISOString();

    const leave: LeaveRequest = {
      id: 'L' + Date.now(),
      requestNo: `LEAVE-${now.slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      attachments: dto.attachments || [],
      lessonCount: dto.lessonCount,
      status: LeaveStatus.PENDING_AFFAIRS,
      currentHandlerRole: UserRole.AFFAIRS,
      currentHandlerId: handler.id,
      currentHandlerName: handler.name,
      blockReason: null,
      materialRequired: [],
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      approverId: null,
      approverName: null,
      idempotencyKey: dto.idempotencyKey,
      urgencyCount: 0,
    };

    this.store.saveLeave(leave);
    this.logService.log(
      'LEAVE', leave.id,
      { role: teacher.role, id: teacher.id, name: teacher.name },
      'CREATE',
      `提交请假申请：${LeaveType[dto.type]} ${dto.startDate}~${dto.endDate}，共${dto.lessonCount}节课`,
      null, LeaveStatus.PENDING_AFFAIRS,
      dto.idempotencyKey,
    );
    return leave;
  }

  list(query: QueryLeaveListDto, viewer: User): { items: LeaveRequest[]; total: number } {
    let items = this.store.listLeaves();

    if (viewer.role === UserRole.TEACHER) {
      items = items.filter((l) => l.teacherId === viewer.id);
    } else if (viewer.role === UserRole.ADVISOR) {
      // 家长顾问可以看所有（实际可按负责班级过滤，这里简化）
    }

    if (query.statuses && query.statuses.length > 0) {
      items = items.filter((l) => query.statuses.includes(l.status));
    }
    if (query.teacherId) {
      items = items.filter((l) => l.teacherId === query.teacherId);
    }
    if (query.currentHandlerId) {
      items = items.filter((l) => l.currentHandlerId === query.currentHandlerId);
    }
    if (query.startDateFrom) {
      items = items.filter((l) => l.startDate >= query.startDateFrom);
    }
    if (query.startDateTo) {
      items = items.filter((l) => l.startDate <= query.startDateTo);
    }

    items.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);

    const total = items.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    items = items.slice((page - 1) * pageSize, page * pageSize);

    return { items, total };
  }

  detail(id: string): LeaveRequest {
    const leave = this.store.getLeave(id);
    if (!leave) throw new NotFoundException('请假申请不存在');
    return leave;
  }

  review(id: string, dto: ReviewLeaveDto, reviewer: User): LeaveRequest {
    if (reviewer.role !== UserRole.AFFAIRS) {
      throw new BadRequestException('只有教务老师可以审批请假申请');
    }
    const leave = this.store.getLeave(id);
    if (!leave) throw new NotFoundException('请假申请不存在');

    const TERMINAL_STATUSES = [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED];
    if (TERMINAL_STATUSES.includes(leave.status)) {
      throw new ConflictException('当前请假申请已结束，不能再次审批');
    }

    const oldStatus = leave.status;
    const now = new Date().toISOString();

    if (dto.action === 'RETURNED') {
      leave.status = LeaveStatus.RETURNED;
      leave.currentHandlerRole = 'TEACHER' as any;
      leave.currentHandlerId = leave.teacherId;
      leave.currentHandlerName = leave.teacherName;
      leave.blockReason = `教务退回：${dto.comment || '需要补充信息'}`;
    } else if (dto.action === 'PENDING_MATERIAL') {
      leave.status = LeaveStatus.PENDING_MATERIAL;
      leave.currentHandlerRole = 'TEACHER' as any;
      leave.currentHandlerId = leave.teacherId;
      leave.currentHandlerName = leave.teacherName;
      leave.materialRequired = dto.materialRequired || [];
      leave.blockReason = `需要补材料：${leave.materialRequired.join('、')}`;
    } else if (dto.action === 'APPROVED') {
      leave.status = LeaveStatus.APPROVED;
      leave.approvedAt = now;
      leave.approverId = reviewer.id;
      leave.approverName = reviewer.name;
      leave.blockReason = null;
    } else if (dto.action === 'REJECTED') {
      leave.status = LeaveStatus.REJECTED;
      leave.approvedAt = now;
      leave.approverId = reviewer.id;
      leave.approverName = reviewer.name;
      leave.blockReason = `审批拒绝：${dto.comment || '不符合规定'}`;
    }
    leave.updatedAt = now;
    this.store.saveLeave(leave);

    this.logService.log(
      'LEAVE', leave.id,
      { role: reviewer.role, id: reviewer.id, name: reviewer.name },
      'REVIEW_' + dto.action,
      dto.comment || '',
      oldStatus, leave.status,
      dto.idempotencyKey,
    );
    return leave;
  }

  updateMaterial(id: string, dto: UpdateLeaveMaterialDto, teacher: User): LeaveRequest {
    const leave = this.store.getLeave(id);
    if (!leave) throw new NotFoundException('请假申请不存在');
    if (leave.teacherId !== teacher.id) {
      throw new BadRequestException('只能修改自己的请假申请');
    }
    if (leave.status !== LeaveStatus.RETURNED && leave.status !== LeaveStatus.PENDING_MATERIAL) {
      throw new ConflictException('当前状态不允许补充材料');
    }

    const existing = this.idemService.checkLeave(dto.idempotencyKey);
    if (existing && existing.id === leave.id && (existing as any)._lastOpIdem === dto.idempotencyKey) {
      return leave;
    }

    const affairsUsers = this.store.findUsersByRole(UserRole.AFFAIRS);
    const handler = affairsUsers.find((a) => a.id === leave.approverId) || affairsUsers[0];

    const oldStatus = leave.status;
    leave.attachments = [...new Set([...leave.attachments, ...(dto.attachments || [])])];
    leave.status = LeaveStatus.PENDING_AFFAIRS;
    leave.currentHandlerRole = 'AFFAIRS' as any;
    leave.currentHandlerId = handler.id;
    leave.currentHandlerName = handler.name;
    leave.blockReason = null;
    leave.materialRequired = [];
    leave.updatedAt = new Date().toISOString();
    (leave as any)._lastOpIdem = dto.idempotencyKey;

    this.store.saveLeave(leave);
    this.logService.log(
      'LEAVE', leave.id,
      { role: teacher.role, id: teacher.id, name: teacher.name },
      'SUPPLY_MATERIAL',
      dto.supplementNote || `补充材料${dto.attachments.length}份`,
      oldStatus, LeaveStatus.PENDING_AFFAIRS,
      dto.idempotencyKey,
    );
    return leave;
  }

  urge(id: string, dto: UrgeLeaveDto, operator: User): LeaveRequest {
    const leave = this.store.getLeave(id);
    if (!leave) throw new NotFoundException('请假申请不存在');
    if (leave.status === LeaveStatus.APPROVED || leave.status === LeaveStatus.REJECTED || leave.status === LeaveStatus.CANCELLED) {
      throw new ConflictException('已结束的申请不能被催促');
    }
    if (leave.currentHandlerRole !== 'AFFAIRS') {
      throw new BadRequestException('当前处理人不是教务，无法执行催促');
    }

    const oldStatus = leave.status;
    leave.urgencyCount += 1;
    leave.status = LeaveStatus.URGENCY;
    leave.blockReason = `已被${operator.name}催促${leave.urgencyCount}次：${dto.urgencyReason || '请尽快处理'}`;
    leave.updatedAt = new Date().toISOString();

    this.store.saveLeave(leave);
    this.logService.log(
      'LEAVE', leave.id,
      { role: operator.role, id: operator.id, name: operator.name },
      'URGE',
      dto.urgencyReason || '催促处理',
      oldStatus, LeaveStatus.URGENCY,
      dto.idempotencyKey,
    );
    return leave;
  }

  getOperationLogs(id: string) {
    return this.logService.query('LEAVE', id);
  }

  getBlockingInfo(id: string) {
    const leave = this.store.getLeave(id);
    if (!leave) throw new NotFoundException('请假申请不存在');

    return {
      id: leave.id,
      requestNo: leave.requestNo,
      currentStatus: leave.status,
      currentHandler: {
        role: leave.currentHandlerRole,
        id: leave.currentHandlerId,
        name: leave.currentHandlerName,
      },
      isBlocked: !!leave.blockReason,
      blockReason: leave.blockReason,
      materialRequired: leave.materialRequired,
      urgencyCount: leave.urgencyCount,
      suggestion: this.buildSuggestion(leave),
    };
  }

  private buildSuggestion(leave: LeaveRequest): string {
    switch (leave.status) {
      case LeaveStatus.URGENCY:
        return `请${leave.currentHandlerName}尽快处理，已有${leave.urgencyCount}次催促`;
      case LeaveStatus.RETURNED:
        return `请${leave.teacherName}参考退回意见完善后重新提交`;
      case LeaveStatus.PENDING_MATERIAL:
        return `请${leave.teacherName}尽快上传材料：${leave.materialRequired.join('、')}`;
      case LeaveStatus.PENDING_AFFAIRS:
        return `请${leave.currentHandlerName}在24小时内审批`;
      case LeaveStatus.APPROVED:
        return '已通过审批，请跟进补课协调';
      case LeaveStatus.REJECTED:
        return '已拒绝，可与教务沟通后重新申请';
      default:
        return '暂无';
    }
  }
}
