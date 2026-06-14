import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../common/store/in-memory.store';
import { User, UserRole } from '../common/types/user.type';
import { LeaveStatus } from '../common/types/leave.type';
import { MakeupStatus } from '../common/types/makeup.type';

@Injectable()
export class DashboardService {
  constructor(private readonly store: InMemoryStore) {}

  getWorkbench(user: User) {
    switch (user.role) {
      case UserRole.TEACHER:
        return this.teacherWorkbench(user);
      case UserRole.AFFAIRS:
        return this.affairsWorkbench(user);
      case UserRole.ADVISOR:
        return this.advisorWorkbench(user);
      default:
        return { user, message: '未知角色' };
    }
  }

  private teacherWorkbench(user: User) {
    const allLeaves = this.store.listLeaves().filter((l) => l.teacherId === user.id);
    const allMakeups = this.store.listMakeups().filter((m) => m.teacherId === user.id);

    const myToDo = {
      leaves: allLeaves.filter((l) =>
        [LeaveStatus.RETURNED, LeaveStatus.PENDING_MATERIAL, LeaveStatus.DRAFT].includes(l.status),
      ).map((l) => ({
        id: l.id, requestNo: l.requestNo, status: l.status,
        blockReason: l.blockReason, materialRequired: l.materialRequired,
        startDate: l.startDate, endDate: l.endDate, updatedAt: l.updatedAt,
      })),
      makeupToPropose: allMakeups.filter((m) => m.status === MakeupStatus.PENDING_TEACHER_CONFIRM).map((m) => ({
        id: m.id, coordinationNo: m.coordinationNo, leaveRequestNo: m.leaveRequestNo,
        originalLessonDates: m.originalLessonDates, blockReason: m.blockReason,
      })),
    };

    const statistics = {
      totalLeavesThisYear: allLeaves.length,
      approvedLeaves: allLeaves.filter((l) => l.status === LeaveStatus.APPROVED).length,
      pendingLeaves: allLeaves.filter((l) =>
        [LeaveStatus.PENDING_AFFAIRS, LeaveStatus.PENDING_MATERIAL, LeaveStatus.URGENCY, LeaveStatus.RETURNED].includes(l.status),
      ).length,
      inProgressMakeups: allMakeups.filter((m) =>
        [MakeupStatus.PENDING_TEACHER_CONFIRM, MakeupStatus.PENDING_PARENT_CONFIRM, MakeupStatus.PENDING_SCHEDULE, MakeupStatus.PENDING_EXECUTE].includes(m.status),
      ).length,
      completedMakeups: allMakeups.filter((m) => m.status === MakeupStatus.COMPLETED).length,
    };

    return {
      user,
      role: '任课老师',
      myToDo,
      statistics,
      relatedEntities: {
        leaves: allLeaves.map((l) => ({ id: l.id, requestNo: l.requestNo, status: l.status, startDate: l.startDate, endDate: l.endDate })),
        makeups: allMakeups.map((m) => ({ id: m.id, coordinationNo: m.coordinationNo, leaveRequestNo: m.leaveRequestNo, status: m.status })),
      },
    };
  }

  private affairsWorkbench(user: User) {
    const allLeaves = this.store.listLeaves();
    const allMakeups = this.store.listMakeups();

    const toReviewLeaves = allLeaves.filter((l) =>
      [LeaveStatus.PENDING_AFFAIRS, LeaveStatus.URGENCY].includes(l.status),
    ).sort((a, b) => {
      if (a.status === LeaveStatus.URGENCY && b.status !== LeaveStatus.URGENCY) return -1;
      if (b.status === LeaveStatus.URGENCY && a.status !== LeaveStatus.URGENCY) return 1;
      return a.urgencyCount < b.urgencyCount ? 1 : -1;
    }).map((l) => ({
      id: l.id, requestNo: l.requestNo, teacherName: l.teacherName,
      type: l.type, startDate: l.startDate, endDate: l.endDate, lessonCount: l.lessonCount,
      status: l.status, urgencyCount: l.urgencyCount, blockReason: l.blockReason,
      createdAt: l.createdAt,
    }));

    const toScheduleMakeups = allMakeups.filter((m) => m.status === MakeupStatus.PENDING_SCHEDULE).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, teacherName: m.teacherName,
      proposedMakeupDates: m.proposedMakeupDates, studentNames: m.studentNames,
    }));

    const blockedMakeups = allMakeups.filter((m) => m.status === MakeupStatus.BLOCKED).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, teacherName: m.teacherName,
      leaveId: m.leaveId, leaveRequestNo: m.leaveRequestNo, blockReason: m.blockReason,
    }));

    const unclosedMakeups = allMakeups.filter((m) => m.status === MakeupStatus.PENDING_EXECUTE).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, proposedMakeupTeacherName: m.proposedMakeupTeacherName,
      proposedMakeupDates: m.proposedMakeupDates,
    }));

    const statistics = {
      pendingLeavesCount: allLeaves.filter((l) => [LeaveStatus.PENDING_AFFAIRS, LeaveStatus.URGENCY].includes(l.status)).length,
      urgencyLeavesCount: allLeaves.filter((l) => l.status === LeaveStatus.URGENCY).length,
      blockedMakeupsCount: blockedMakeups.length,
      toScheduleCount: toScheduleMakeups.length,
      pendingExecuteCount: unclosedMakeups.length,
      totalMakeups: allMakeups.length,
      totalLeaves: allLeaves.length,
    };

    return {
      user,
      role: '教务老师',
      toDo: {
        toReviewLeaves,
        toScheduleMakeups,
        blockedMakeups,
        unclosedMakeups,
      },
      statistics,
    };
  }

  private advisorWorkbench(user: User) {
    const allMakeups = this.store.listMakeups();
    const allLeaves = this.store.listLeaves();

    const toConfirmMakeups = allMakeups.filter((m) => m.status === MakeupStatus.PENDING_PARENT_CONFIRM).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, teacherName: m.teacherName,
      studentNames: m.studentNames, proposedMakeupDates: m.proposedMakeupDates,
      proposedMakeupTeacherName: m.proposedMakeupTeacherName,
    }));

    const urgencyLeaves = allLeaves.filter((l) => l.status === LeaveStatus.URGENCY).map((l) => ({
      id: l.id, requestNo: l.requestNo, teacherName: l.teacherName,
      startDate: l.startDate, endDate: l.endDate, urgencyCount: l.urgencyCount,
      blockReason: l.blockReason,
    }));

    const blockedMakeups = allMakeups.filter((m) => m.status === MakeupStatus.BLOCKED).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, leaveRequestNo: m.leaveRequestNo,
      teacherName: m.teacherName, studentNames: m.studentNames, blockReason: m.blockReason,
    }));

    const inProgressMakeups = allMakeups.filter((m) =>
      [MakeupStatus.PENDING_TEACHER_CONFIRM, MakeupStatus.PENDING_SCHEDULE, MakeupStatus.PENDING_EXECUTE].includes(m.status),
    ).map((m) => ({
      id: m.id, coordinationNo: m.coordinationNo, status: m.status,
      teacherName: m.teacherName, studentNames: m.studentNames,
      currentHandlerName: m.currentHandlerName, blockReason: m.blockReason,
    }));

    const statistics = {
      toConfirmParent: toConfirmMakeups.length,
      blockedMakeups: blockedMakeups.length,
      inProgressMakeups: inProgressMakeups.length,
      urgencyLeaves: urgencyLeaves.length,
      completedMakeups: allMakeups.filter((m) => m.status === MakeupStatus.COMPLETED).length,
    };

    return {
      user,
      role: '家长顾问',
      toDo: {
        toConfirmMakeups,
        urgencyLeaves,
        blockedMakeups,
        inProgressMakeups,
      },
      statistics,
    };
  }

  getRolesCatalog() {
    return {
      TEACHER: {
        name: '任课老师',
        sampleUsers: this.store.findUsersByRole(UserRole.TEACHER).map((u) => ({ id: u.id, name: u.name })),
        entryPoints: [
          { method: 'GET', path: '/dashboard', desc: '工作台（我的待办+统计）' },
          { method: 'POST', path: '/leaves', desc: '提交请假申请（幂等）' },
          { method: 'GET', path: '/leaves', desc: '查看我的请假列表' },
          { method: 'PATCH', path: '/leaves/:id/material', desc: '对退回/补材料的请假重新提交（幂等）' },
          { method: 'PATCH', path: '/makeups/:id/propose', desc: '对补课协调提议时间（幂等）' },
        ],
      },
      AFFAIRS: {
        name: '教务老师',
        sampleUsers: this.store.findUsersByRole(UserRole.AFFAIRS).map((u) => ({ id: u.id, name: u.name })),
        entryPoints: [
          { method: 'GET', path: '/dashboard', desc: '工作台（审批/排课/阻塞列表）' },
          { method: 'PATCH', path: '/leaves/:id/review', desc: '审批请假：通过/拒绝/退回/要求补材料（幂等）' },
          { method: 'PATCH', path: '/leaves/:id/urge', desc: '可自行标记催促（幂等）' },
          { method: 'GET', path: '/leaves/:id/blocking', desc: '请假卡在哪里+当前处理人' },
          { method: 'POST', path: '/makeups', desc: '创建补课协调（幂等）' },
          { method: 'PATCH', path: '/makeups/:id/schedule', desc: '正式排课（幂等）' },
          { method: 'PATCH', path: '/makeups/:id/complete', desc: '标记补课完成（幂等）' },
          { method: 'GET', path: '/makeups/:id/review', desc: '补课协调回看+为什么没完成' },
          { method: 'POST', path: '/exports/tasks', desc: '创建导出任务' },
        ],
      },
      ADVISOR: {
        name: '家长顾问',
        sampleUsers: this.store.findUsersByRole(UserRole.ADVISOR).map((u) => ({ id: u.id, name: u.name })),
        entryPoints: [
          { method: 'GET', path: '/dashboard', desc: '工作台（需联系家长/需催促/阻塞项）' },
          { method: 'PATCH', path: '/leaves/:id/urge', desc: '催促教务处理请假（URGENCY状态）（幂等）' },
          { method: 'GET', path: '/leaves/:id/blocking', desc: '查看请假阻塞情况' },
          { method: 'PATCH', path: '/makeups/:id/confirm-parent', desc: '转达家长对补课时间的确认（幂等）' },
          { method: 'GET', path: '/makeups/:id/review', desc: '完整回看：为什么还没完成' },
          { method: 'POST', path: '/exports/tasks', desc: '创建导出任务' },
        ],
      },
    };
  }
}
