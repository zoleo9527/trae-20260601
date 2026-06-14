import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryStore } from '../common/store/in-memory.store';
import { MakeupCoordination, MakeupStatus, CoordinationLog } from '../common/types/makeup.type';
import { LeaveStatus } from '../common/types/leave.type';
import { User, UserRole } from '../common/types/user.type';
import { OperationLogService } from '../common/services/operation-log.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import {
  CreateMakeupDto,
  ProposeMakeupDto,
  ConfirmMakeupDto,
  ScheduleMakeupDto,
  MarkCompleteDto,
  QueryMakeupListDto,
} from './dto/makeup.dto';

@Injectable()
export class MakeupService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logService: OperationLogService,
    private readonly idemService: IdempotencyService,
  ) {}

  create(dto: CreateMakeupDto, creator: User): MakeupCoordination {
    const existing = this.idemService.checkMakeup(dto.idempotencyKey);
    if (existing) return existing;
    const opHit = this.idemService.consumeOperation(
      dto.idempotencyKey, 'MAKEUP', null, 'CREATE', creator.id,
    );
    if (opHit) {
      const retry = this.idemService.checkMakeup(dto.idempotencyKey);
      if (retry) return retry;
    }

    const leave = this.store.getLeave(dto.leaveId);
    if (!leave) throw new NotFoundException('关联的请假申请不存在');

    const old = this.store.findMakeupByLeaveId(dto.leaveId);
    if (old) return old;

    const now = new Date().toISOString();
    let status: MakeupStatus;
    let handlerRole: any;
    let handlerId: string;
    let handlerName: string;
    let blockReason: string | null = null;

    if (leave.status !== LeaveStatus.APPROVED) {
      status = MakeupStatus.BLOCKED;
      handlerRole = UserRole.AFFAIRS;
      const affairs = this.store.findUsersByRole(UserRole.AFFAIRS)[0];
      handlerId = affairs.id;
      handlerName = affairs.name;
      blockReason = `请假尚未审批通过（当前状态：${leave.status}），补课协调无法启动`;
    } else {
      status = MakeupStatus.PENDING_TEACHER_CONFIRM;
      handlerRole = 'TEACHER';
      handlerId = leave.teacherId;
      handlerName = leave.teacherName;
    }

    const makeup: MakeupCoordination = {
      id: 'M' + Date.now(),
      coordinationNo: `MAKEUP-${now.slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
      leaveId: dto.leaveId,
      leaveRequestNo: leave.requestNo,
      teacherId: leave.teacherId,
      teacherName: leave.teacherName,
      studentIds: dto.studentIds || [],
      studentNames: [],
      originalLessonDates: dto.originalLessonDates || [],
      proposedMakeupDates: [],
      proposedMakeupTeacherId: null,
      proposedMakeupTeacherName: null,
      status,
      currentHandlerRole: handlerRole,
      currentHandlerId: handlerId,
      currentHandlerName: handlerName,
      blockReason,
      coordinationLogs: [
        {
          id: uuidv4(),
          timestamp: now,
          actorRole: creator.role,
          actorId: creator.id,
          actorName: creator.name,
          action: 'CREATE_COORDINATION',
          comment: '创建补课协调任务',
        },
      ],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      idempotencyKey: dto.idempotencyKey,
    };
    this.store.saveMakeup(makeup);
    this.logService.log(
      'MAKEUP', makeup.id,
      { role: creator.role, id: creator.id, name: creator.name },
      'CREATE',
      `关联请假：${leave.requestNo}`,
      null, status, dto.idempotencyKey,
    );
    return makeup;
  }

  list(query: QueryMakeupListDto, viewer: User): { items: MakeupCoordination[]; total: number } {
    let items = this.store.listMakeups();

    if (viewer.role === UserRole.TEACHER) {
      items = items.filter((m) => m.teacherId === viewer.id);
    }
    if (query.statuses && query.statuses.length > 0) {
      items = items.filter((m) => query.statuses.includes(m.status));
    }
    if (query.teacherId) {
      items = items.filter((m) => m.teacherId === query.teacherId);
    }
    if (query.leaveId) {
      items = items.filter((m) => m.leaveId === query.leaveId);
    }
    if (query.currentHandlerId) {
      items = items.filter((m) => m.currentHandlerId === query.currentHandlerId);
    }

    items.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
    const total = items.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    items = items.slice((page - 1) * pageSize, page * pageSize);

    return { items, total };
  }

  detail(id: string): MakeupCoordination {
    const m = this.store.getMakeup(id);
    if (!m) throw new NotFoundException('补课协调不存在');
    return m;
  }

  proposeMakeup(id: string, dto: ProposeMakeupDto, teacher: User): MakeupCoordination {
    const makeup = this.store.getMakeup(id);
    if (!makeup) throw new NotFoundException('补课协调不存在');
    if (teacher.role !== UserRole.TEACHER || makeup.teacherId !== teacher.id) {
      throw new BadRequestException('只有请假的任课老师可以提议补课时间');
    }
    if (makeup.status !== MakeupStatus.PENDING_TEACHER_CONFIRM && makeup.status !== MakeupStatus.PENDING_PARENT_CONFIRM) {
      throw new ConflictException(`当前状态[${makeup.status}]不允许提议补课时间`);
    }

    const idemHit = this.idemService.consumeOperation(
      dto.idempotencyKey, 'MAKEUP', id, 'PROPOSE_MAKEUP', teacher.id,
    );
    if (idemHit) {
      return makeup;
    }

    const advisors = this.store.findUsersByRole(UserRole.ADVISOR);
    const advisor = advisors[0];
    const oldStatus = makeup.status;

    makeup.proposedMakeupDates = dto.proposedMakeupDates;
    if (dto.proposedMakeupTeacherId) {
      const t = this.store.getUser(dto.proposedMakeupTeacherId);
      makeup.proposedMakeupTeacherId = dto.proposedMakeupTeacherId;
      makeup.proposedMakeupTeacherName = t?.name || dto.proposedMakeupTeacherId;
    } else {
      makeup.proposedMakeupTeacherId = makeup.teacherId;
      makeup.proposedMakeupTeacherName = makeup.teacherName;
    }
    makeup.status = MakeupStatus.PENDING_PARENT_CONFIRM;
    makeup.currentHandlerRole = 'ADVISOR' as any;
    makeup.currentHandlerId = advisor.id;
    makeup.currentHandlerName = advisor.name;
    makeup.blockReason = `补课时间已提议，正在与家长确认：${dto.proposedMakeupDates.join('；')}`;
    makeup.updatedAt = new Date().toISOString();

    this.pushLog(makeup, teacher, 'PROPOSE_MAKEUP', dto.comment || `提议补课时间${dto.proposedMakeupDates.length}个`);
    this.store.saveMakeup(makeup);
    this.logService.log(
      'MAKEUP', makeup.id,
      { role: teacher.role, id: teacher.id, name: teacher.name },
      'PROPOSE_MAKEUP',
      dto.comment || '',
      oldStatus, makeup.status, dto.idempotencyKey,
    );
    return makeup;
  }

  confirmParent(id: string, dto: ConfirmMakeupDto, advisor: User): MakeupCoordination {
    const makeup = this.store.getMakeup(id);
    if (!makeup) throw new NotFoundException('补课协调不存在');
    if (advisor.role !== UserRole.ADVISOR) {
      throw new BadRequestException('只有家长顾问可以确认家长意见');
    }
    if (makeup.status !== MakeupStatus.PENDING_PARENT_CONFIRM) {
      throw new ConflictException(`当前状态[${makeup.status}]不允许家长确认`);
    }

    const idemHit = this.idemService.consumeOperation(
      dto.idempotencyKey, 'MAKEUP', id, 'CONFIRM_PARENT_' + dto.action, advisor.id,
    );
    if (idemHit) {
      return makeup;
    }

    const oldStatus = makeup.status;
    const affairs = this.store.findUsersByRole(UserRole.AFFAIRS)[0];

    if (dto.action === 'REJECTED') {
      makeup.status = MakeupStatus.PENDING_TEACHER_CONFIRM;
      makeup.currentHandlerRole = 'TEACHER' as any;
      makeup.currentHandlerId = makeup.teacherId;
      makeup.currentHandlerName = makeup.teacherName;
      makeup.blockReason = `家长拒绝了提议的补课时间：${dto.comment || '时间不合适，请重新提议'}`;
      this.pushLog(makeup, advisor, 'PARENT_REJECTED', dto.comment || '家长拒绝');
    } else {
      makeup.status = MakeupStatus.PENDING_SCHEDULE;
      makeup.currentHandlerRole = 'AFFAIRS' as any;
      makeup.currentHandlerId = affairs.id;
      makeup.currentHandlerName = affairs.name;
      makeup.blockReason = dto.action === 'PARTIAL_CONFIRMED'
        ? `部分家长已确认（${dto.confirmedStudentIds?.length || 0}人），剩余家长需跟进，待教务最终排课`
        : '全部家长已确认，待教务正式排课';
      this.pushLog(makeup, advisor, dto.action === 'PARTIAL_CONFIRMED' ? 'PARENT_PARTIAL_CONFIRMED' : 'PARENT_ALL_CONFIRMED',
        dto.comment || '家长确认');
    }
    makeup.updatedAt = new Date().toISOString();

    this.store.saveMakeup(makeup);
    this.logService.log(
      'MAKEUP', makeup.id,
      { role: advisor.role, id: advisor.id, name: advisor.name },
      'CONFIRM_PARENT_' + dto.action,
      dto.comment || '',
      oldStatus, makeup.status, dto.idempotencyKey,
    );
    return makeup;
  }

  schedule(id: string, dto: ScheduleMakeupDto, affairs: User): MakeupCoordination {
    const makeup = this.store.getMakeup(id);
    if (!makeup) throw new NotFoundException('补课协调不存在');
    if (affairs.role !== UserRole.AFFAIRS) throw new BadRequestException('只有教务可以排课');
    if (makeup.status !== MakeupStatus.PENDING_SCHEDULE) {
      throw new ConflictException(`当前状态[${makeup.status}]不允许排课`);
    }

    const idemHit = this.idemService.consumeOperation(
      dto.idempotencyKey, 'MAKEUP', id, 'SCHEDULE', affairs.id,
    );
    if (idemHit) {
      return makeup;
    }

    const oldStatus = makeup.status;
    makeup.status = MakeupStatus.PENDING_EXECUTE;
    makeup.currentHandlerRole = 'TEACHER' as any;
    makeup.currentHandlerId = makeup.proposedMakeupTeacherId || makeup.teacherId;
    makeup.currentHandlerName = makeup.proposedMakeupTeacherName || makeup.teacherName;
    makeup.blockReason = null;
    makeup.updatedAt = new Date().toISOString();

    this.pushLog(makeup, affairs, 'SCHEDULED', dto.comment || '教务已排课，等待老师执行');
    this.store.saveMakeup(makeup);
    this.logService.log(
      'MAKEUP', makeup.id,
      { role: affairs.role, id: affairs.id, name: affairs.name },
      'SCHEDULE', dto.comment || '',
      oldStatus, makeup.status, dto.idempotencyKey,
    );
    return makeup;
  }

  markComplete(id: string, dto: MarkCompleteDto, affairs: User): MakeupCoordination {
    const makeup = this.store.getMakeup(id);
    if (!makeup) throw new NotFoundException('补课协调不存在');
    if (affairs.role !== UserRole.AFFAIRS) throw new BadRequestException('只有教务可以标记完成');
    if (makeup.status !== MakeupStatus.PENDING_EXECUTE) {
      throw new ConflictException(`当前状态[${makeup.status}]不允许标记完成`);
    }

    const idemHit = this.idemService.consumeOperation(
      dto.idempotencyKey, 'MAKEUP', id, 'COMPLETE', affairs.id,
    );
    if (idemHit) {
      return makeup;
    }

    const oldStatus = makeup.status;
    const now = new Date().toISOString();
    makeup.status = MakeupStatus.COMPLETED;
    makeup.completedAt = now;
    makeup.blockReason = null;
    makeup.updatedAt = now;

    this.pushLog(makeup, affairs, 'COMPLETED', dto.comment || '补课已完成');
    this.store.saveMakeup(makeup);
    this.logService.log(
      'MAKEUP', makeup.id,
      { role: affairs.role, id: affairs.id, name: affairs.name },
      'COMPLETE', dto.comment || '',
      oldStatus, MakeupStatus.COMPLETED, dto.idempotencyKey,
    );
    return makeup;
  }

  review(id: string) {
    const makeup = this.store.getMakeup(id);
    if (!makeup) throw new NotFoundException('补课协调不存在');
    const opLogs = this.logService.query('MAKEUP', id);
    return {
      basic: {
        id: makeup.id,
        coordinationNo: makeup.coordinationNo,
        leaveRequestNo: makeup.leaveRequestNo,
        teacherName: makeup.teacherName,
        studentCount: makeup.studentIds.length,
        originalLessonDates: makeup.originalLessonDates,
        proposedMakeupDates: makeup.proposedMakeupDates,
        proposedMakeupTeacherName: makeup.proposedMakeupTeacherName,
        status: makeup.status,
        createdAt: makeup.createdAt,
        completedAt: makeup.completedAt,
      },
      currentResponsibility: {
        handlerRole: makeup.currentHandlerRole,
        handlerId: makeup.currentHandlerId,
        handlerName: makeup.currentHandlerName,
        blockReason: makeup.blockReason,
        whyNotCompleted: this.buildWhyNotCompleted(makeup),
      },
      timeline: [...makeup.coordinationLogs, ...opLogs.map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        actorRole: l.actorRole,
        actorId: l.actorId,
        actorName: l.actorName,
        action: l.action,
        comment: `${l.comment || ''}${l.oldStatus ? ` [状态: ${l.oldStatus}→${l.newStatus}]` : ''}`,
      }))].sort((a: any, b: any) => a.timestamp < b.timestamp ? -1 : 1),
    };
  }

  private buildWhyNotCompleted(makeup: MakeupCoordination): string {
    if (makeup.status === MakeupStatus.COMPLETED) return '已完成';
    if (makeup.status === MakeupStatus.CANCELLED) return '已取消';
    switch (makeup.status) {
      case MakeupStatus.BLOCKED:
        return `阻塞：${makeup.blockReason || '上游请假未审批'}`;
      case MakeupStatus.PENDING_TEACHER_CONFIRM:
        return `等待任课老师[${makeup.teacherName}]提议补课时间`;
      case MakeupStatus.PENDING_PARENT_CONFIRM:
        return `等待家长顾问[${makeup.currentHandlerName}]联系家长确认补课时间`;
      case MakeupStatus.PENDING_SCHEDULE:
        return `等待教务[${makeup.currentHandlerName}]正式排课`;
      case MakeupStatus.PENDING_EXECUTE:
        return `等待补课老师[${makeup.currentHandlerName}]实际授课完成`;
      default:
        return makeup.blockReason || '处理中';
    }
  }

  private pushLog(makeup: MakeupCoordination, actor: User, action: string, comment: string): CoordinationLog {
    const log: CoordinationLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      actorRole: actor.role,
      actorId: actor.id,
      actorName: actor.name,
      action,
      comment,
    };
    makeup.coordinationLogs.push(log);
    return log;
  }
}
