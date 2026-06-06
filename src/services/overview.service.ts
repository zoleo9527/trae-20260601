import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { CheckInAssignment } from '../entities/check-in-assignment.entity';
import { BedAdjustment } from '../entities/bed-adjustment.entity';
import { Staff } from '../entities/staff.entity';
import { CheckInStatus, AdjustmentStatus, StaffRoleLabel } from '../common/enums';

interface TodoItem {
  id: string;
  type: 'check_in' | 'bed_adjustment';
  status: string;
  blockedAt: string;
  unfinishedReason: string | null;
  responsibleRole: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleCategoryStats {
  pending: number;
  overdue: number;
  disputed: number;
  inProgress: number;
  latestRecord: TodoItem | null;
}

interface RoleStats {
  role: string;
  roleLabel: string;
  checkIn: RoleCategoryStats;
  bedAdjustment: RoleCategoryStats;
  total: {
    pending: number;
    overdue: number;
    disputed: number;
    inProgress: number;
  };
}

interface OverviewResponse {
  summary: {
    totalPending: number;
    totalOverdue: number;
    totalDisputed: number;
    totalInProgress: number;
  };
  byRole: RoleStats[];
  allOverdue: TodoItem[];
  allDisputed: TodoItem[];
}

@Injectable()
export class OverviewService {
  constructor(
    @InjectRepository(CheckInAssignment)
    private readonly checkInRepository: Repository<CheckInAssignment>,
    @InjectRepository(BedAdjustment)
    private readonly adjustmentRepository: Repository<BedAdjustment>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async getTodoOverview(): Promise<OverviewResponse> {
    const staffs = await this.staffRepository.find({ where: { active: true } });
    const roles = [...new Set(staffs.map(s => s.role))];

    const allCheckIns = await this.checkInRepository.find({
      relations: ['student', 'bed', 'currentHandler', 'assignedTo'],
      order: { updatedAt: 'DESC' },
    });

    const allAdjustments = await this.adjustmentRepository.find({
      relations: ['student', 'sourceBed', 'targetBed', 'currentHandler', 'assignedTo'],
      order: { updatedAt: 'DESC' },
    });

    const byRole: RoleStats[] = [];

    for (const role of roles) {
      const roleStaffs = staffs.filter(s => s.role === role);
      const roleStaffIds = roleStaffs.map(s => s.id);

      const roleCheckIns = allCheckIns.filter(item =>
        (item.currentHandlerId && roleStaffIds.includes(item.currentHandlerId)) ||
        (item.assignedToId && roleStaffIds.includes(item.assignedToId))
      );

      const roleAdjustments = allAdjustments.filter(item =>
        (item.currentHandlerId && roleStaffIds.includes(item.currentHandlerId)) ||
        (item.assignedToId && roleStaffIds.includes(item.assignedToId))
      );

      const checkInStats = this.calculateCategoryStats(
        roleCheckIns.map(item => this.mapCheckInToTodo(item)),
        'check_in'
      );

      const adjustmentStats = this.calculateCategoryStats(
        roleAdjustments.map(item => this.mapAdjustmentToTodo(item)),
        'bed_adjustment'
      );

      byRole.push({
        role,
        roleLabel: StaffRoleLabel[role] || role,
        checkIn: checkInStats,
        bedAdjustment: adjustmentStats,
        total: {
          pending: checkInStats.pending + adjustmentStats.pending,
          overdue: checkInStats.overdue + adjustmentStats.overdue,
          disputed: checkInStats.disputed + adjustmentStats.disputed,
          inProgress: checkInStats.inProgress + adjustmentStats.inProgress,
        },
      });
    }

    const allCheckInTodos = allCheckIns.map(item => this.mapCheckInToTodo(item));
    const allAdjustmentTodos = allAdjustments.map(item => this.mapAdjustmentToTodo(item));
    const allTodos = [...allCheckInTodos, ...allAdjustmentTodos];

    const summary = {
      totalPending: allTodos.filter(t => this.isPendingStatus(t.status)).length,
      totalOverdue: allTodos.filter(t => this.isOverdueStatus(t.status)).length,
      totalDisputed: allTodos.filter(t => this.isDisputedStatus(t.status)).length,
      totalInProgress: allTodos.filter(t => this.isInProgressStatus(t.status)).length,
    };

    const allOverdue = allTodos
      .filter(t => this.isOverdueStatus(t.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    const allDisputed = allTodos
      .filter(t => this.isDisputedStatus(t.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    return {
      summary,
      byRole,
      allOverdue,
      allDisputed,
    };
  }

  private calculateCategoryStats(items: TodoItem[], type: string): RoleCategoryStats {
    const pending = items.filter(t => this.isPendingStatus(t.status)).length;
    const overdue = items.filter(t => this.isOverdueStatus(t.status)).length;
    const disputed = items.filter(t => this.isDisputedStatus(t.status)).length;
    const inProgress = items.filter(t => this.isInProgressStatus(t.status)).length;

    const latestRecord = items.length > 0 ? items[0] : null;

    return {
      pending,
      overdue,
      disputed,
      inProgress,
      latestRecord,
    };
  }

  private isPendingStatus(status: string): boolean {
    return status === CheckInStatus.PENDING || status === AdjustmentStatus.PENDING ||
           status === CheckInStatus.RETURNED || status === AdjustmentStatus.RETURNED ||
           status === CheckInStatus.APPROVED || status === AdjustmentStatus.APPROVED;
  }

  private isOverdueStatus(status: string): boolean {
    return status === CheckInStatus.OVERDUE || status === AdjustmentStatus.OVERDUE;
  }

  private isDisputedStatus(status: string): boolean {
    return status === CheckInStatus.DISPUTED || status === AdjustmentStatus.DISPUTED;
  }

  private isInProgressStatus(status: string): boolean {
    return status === CheckInStatus.IN_PROGRESS || status === AdjustmentStatus.IN_PROGRESS ||
           status === AdjustmentStatus.MAINTENANCE_REQUIRED;
  }

  private mapCheckInToTodo(item: CheckInAssignment): TodoItem {
    const handler = item.currentHandler || item.assignedTo;
    const responsibleRole = handler ? StaffRoleLabel[handler.role] || handler.role : '待确认';
    const blockedAt = this.getCheckInBlockedAt(item, handler?.role);
    const unfinishedReason = this.getCheckInUnfinishedReason(item);

    return {
      id: item.id,
      type: 'check_in',
      status: item.status,
      blockedAt,
      unfinishedReason,
      responsibleRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapAdjustmentToTodo(item: BedAdjustment): TodoItem {
    const handler = item.currentHandler || item.assignedTo;
    const responsibleRole = handler ? StaffRoleLabel[handler.role] || handler.role : '待确认';
    const blockedAt = this.getAdjustmentBlockedAt(item, handler?.role);
    const unfinishedReason = this.getAdjustmentUnfinishedReason(item, handler?.role);

    return {
      id: item.id,
      type: 'bed_adjustment',
      status: item.status,
      blockedAt,
      unfinishedReason,
      responsibleRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private getCheckInBlockedAt(item: CheckInAssignment, role?: string): string {
    switch (item.status) {
      case CheckInStatus.PENDING:
        return '待宿管员初查分配';
      case CheckInStatus.IN_PROGRESS:
        if (role === 'dorm_manager') return '宿管员核实分配信息中';
        return '辅导员审核中';
      case CheckInStatus.RETURNED:
        return '退回学生补充材料';
      case CheckInStatus.REJECTED:
        return '已拒绝，流程终止';
      case CheckInStatus.DISPUTED:
        return '责任争议，三方协商中';
      case CheckInStatus.OVERDUE:
        if (role === 'dorm_manager') return '宿管分配逾期，待跟进';
        return '处理逾期，待跟进';
      case CheckInStatus.APPROVED:
        return '已通过，待宿管员确认入住';
      case CheckInStatus.COMPLETED:
        return '已完成入住';
      default:
        return '处理中';
    }
  }

  private getCheckInUnfinishedReason(item: CheckInAssignment): string | null {
    if (item.status === CheckInStatus.COMPLETED) return null;
    if (item.returnReason) return `退回补充：${item.returnReason}`;
    if (item.rejectionReason) return `已拒绝：${item.rejectionReason}`;
    if (item.remark) return item.remark;
    if (item.status === CheckInStatus.OVERDUE) return '超过预期处理时间未完成';
    if (item.status === CheckInStatus.DISPUTED) return '存在责任争议，待协商解决';
    return '正在按流程推进';
  }

  private getAdjustmentBlockedAt(item: BedAdjustment, role?: string): string {
    switch (item.status) {
      case AdjustmentStatus.PENDING:
        return '待宿管员初查申请';
      case AdjustmentStatus.IN_PROGRESS:
        if (role === 'maintenance') return '维修人员处理设施问题中';
        if (role === 'dorm_manager') return '宿管员核实情况中';
        return '辅导员审核中';
      case AdjustmentStatus.RETURNED:
        return '退回学生补充材料';
      case AdjustmentStatus.REJECTED:
        return '已拒绝，流程终止';
      case AdjustmentStatus.DISPUTED:
        return '责任争议，三方协商中';
      case AdjustmentStatus.OVERDUE:
        if (role === 'maintenance') return '维修处理逾期，待跟进';
        return '处理逾期，待跟进';
      case AdjustmentStatus.APPROVED:
        return '已通过，待宿管员执行调换';
      case AdjustmentStatus.COMPLETED:
        return '已完成床位调换';
      case AdjustmentStatus.MAINTENANCE_REQUIRED:
        return '维修人员处理中，待修复完成';
      default:
        return '处理中';
    }
  }

  private getAdjustmentUnfinishedReason(item: BedAdjustment, role?: string): string | null {
    if (item.status === AdjustmentStatus.COMPLETED) return null;
    if (item.returnReason) return `退回补充：${item.returnReason}`;
    if (item.rejectionReason) return `已拒绝：${item.rejectionReason}`;
    if (item.remark) return item.remark;
    if (item.status === AdjustmentStatus.OVERDUE) return '超过预期处理时间未完成';
    if (item.status === AdjustmentStatus.DISPUTED) return '存在责任争议，待协商解决';
    if (item.status === AdjustmentStatus.MAINTENANCE_REQUIRED) return '需维修人员配合处理设施问题';
    if (item.status === AdjustmentStatus.IN_PROGRESS) {
      if (role === 'maintenance') {
        return item.reasonDetail ? `维修处理中：${item.reasonDetail}` : '维修人员正在处理设施问题';
      }
      if (role === 'dorm_manager') return '宿管员正在核实情况';
    }
    if (item.reasonDetail) return `调整原因：${item.reasonDetail}`;
    return '正在按流程推进';
  }
}
