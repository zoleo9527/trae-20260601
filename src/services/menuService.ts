import { getDatabase } from '../database/connection';
import {
  ScreeningExceptionStatus,
  ScreeningExceptionType,
  RefundStatus,
  RefundReason,
  UserRole,
  MenuItem
} from '../types';

function countExceptions(filters: { status?: string; type?: string }): number {
  const db = getDatabase();
  return db.screeningExceptions.filter(e => {
    if (filters.status && e.status !== filters.status) return false;
    if (filters.type && e.type !== filters.type) return false;
    return true;
  }).length;
}

function countRefunds(filters: { status?: string; reason?: string }): number {
  const db = getDatabase();
  return db.refunds.filter(r => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.reason && r.reason !== filters.reason) return false;
    return true;
  }).length;
}

export function getMenuStatistics(role: UserRole): Record<string, { pendingCount: number; stuckCount: number; highlightTip?: string }> {
  const stats: Record<string, { pendingCount: number; stuckCount: number; highlightTip?: string }> = {};

  const processingExceptions = countExceptions({ status: ScreeningExceptionStatus.PROCESSING });
  const reportedExceptions = countExceptions({ status: ScreeningExceptionStatus.REPORTED });
  const pendingRefunds = countRefunds({ status: RefundStatus.PENDING });
  const approvedRefunds = countRefunds({ status: RefundStatus.APPROVED });

  if (role === UserRole.SCHEDULE_MANAGER) {
    const tempHallChangePending = countExceptions({
      status: ScreeningExceptionStatus.PROCESSING,
      type: ScreeningExceptionType.TEMP_HALL_CHANGE
    });
    const equipmentFailureStuck = countExceptions({
      status: ScreeningExceptionStatus.PROCESSING,
      type: ScreeningExceptionType.EQUIPMENT_FAILURE
    });

    stats['exception-list'] = {
      pendingCount: reportedExceptions + processingExceptions,
      stuckCount: equipmentFailureStuck,
      highlightTip: '含设备故障待处理'
    };

    stats['hall-change'] = {
      pendingCount: tempHallChangePending,
      stuckCount: 0,
      highlightTip: tempHallChangePending > 0 ? `${tempHallChangePending}条待换厅` : undefined
    };

    stats['exception-report'] = {
      pendingCount: 0,
      stuckCount: 0
    };

    stats['schedule'] = {
      pendingCount: 0,
      stuckCount: 0
    };
  }

  if (role === UserRole.TICKET_SUPERVISOR) {
    const groupTicketIssueRefunds = countRefunds({
      reason: RefundReason.GROUP_TICKET_ISSUE,
      status: RefundStatus.PENDING
    });
    const screeningExceptionRefunds = countRefunds({
      reason: RefundReason.SCREENING_EXCEPTION,
      status: RefundStatus.PENDING
    });

    stats['refund-list'] = {
      pendingCount: pendingRefunds,
      stuckCount: 0,
      highlightTip: pendingRefunds > 0 ? `${pendingRefunds}条待审核` : undefined
    };

    stats['refund-audit'] = {
      pendingCount: pendingRefunds + approvedRefunds,
      stuckCount: 0,
      highlightTip: `${pendingRefunds}待审核, ${approvedRefunds}待退款`
    };

    stats['group-ticket'] = {
      pendingCount: groupTicketIssueRefunds,
      stuckCount: 0,
      highlightTip: groupTicketIssueRefunds > 0 ? `${groupTicketIssueRefunds}条团体票核销纠纷` : undefined
    };

    stats['refund-review'] = {
      pendingCount: 0,
      stuckCount: 0
    };
  }

  if (role === UserRole.DUTY_MANAGER) {
    const equipmentFailureRefunds = countExceptions({
      type: ScreeningExceptionType.EQUIPMENT_FAILURE,
      status: ScreeningExceptionStatus.REFUND_INITIATED
    });
    const stuckExceptions = countExceptions({ status: ScreeningExceptionStatus.PROCESSING }) +
                           countExceptions({ status: ScreeningExceptionStatus.REFUND_INITIATED });
    const resolvedExceptions = countExceptions({ status: ScreeningExceptionStatus.RESOLVED });

    stats['dashboard'] = {
      pendingCount: reportedExceptions + pendingRefunds,
      stuckCount: stuckExceptions,
      highlightTip: `含${equipmentFailureRefunds}条设备故障退票中`
    };

    stats['exception-all'] = {
      pendingCount: reportedExceptions + processingExceptions,
      stuckCount: stuckExceptions,
      highlightTip: stuckExceptions > 0 ? `${stuckExceptions}条处理中卡住` : undefined
    };

    stats['refund-all'] = {
      pendingCount: pendingRefunds + approvedRefunds,
      stuckCount: 0
    };

    stats['exception-close'] = {
      pendingCount: resolvedExceptions,
      stuckCount: 0,
      highlightTip: resolvedExceptions > 0 ? `${resolvedExceptions}条待关闭确认` : undefined
    };

    stats['hall-inspection'] = {
      pendingCount: 0,
      stuckCount: 0
    };
  }

  return stats;
}

export function getRoleMenusWithStats(role: UserRole): MenuItem[] {
  const stats = getMenuStatistics(role);

  const baseMenus: Record<UserRole, MenuItem[]> = {
    [UserRole.SCHEDULE_MANAGER]: [
      {
        id: 'schedule',
        name: '排片管理',
        path: '/schedule',
        icon: 'calendar'
      },
      {
        id: 'exception-report',
        name: '放映异常上报',
        path: '/exception/report',
        icon: 'plus-circle',
        quickFilter: {}
      },
      {
        id: 'exception-list',
        name: '放映异常列表',
        path: '/exception/list',
        icon: 'list',
        quickFilter: {}
      },
      {
        id: 'hall-change',
        name: '临时换厅处理',
        path: '/exception/hall-change',
        icon: 'swap',
        quickFilter: {
          type: ScreeningExceptionType.TEMP_HALL_CHANGE,
          status: ScreeningExceptionStatus.PROCESSING
        }
      }
    ],
    [UserRole.TICKET_SUPERVISOR]: [
      {
        id: 'refund-list',
        name: '退票申请列表',
        path: '/refund/list',
        icon: 'list',
        quickFilter: {}
      },
      {
        id: 'refund-audit',
        name: '退票审核',
        path: '/refund/audit',
        icon: 'check-circle',
        quickFilter: {
          status: RefundStatus.PENDING
        }
      },
      {
        id: 'group-ticket',
        name: '团体票核销',
        path: '/group-ticket',
        icon: 'team',
        quickFilter: {
          reason: RefundReason.GROUP_TICKET_ISSUE
        }
      },
      {
        id: 'refund-review',
        name: '退票处理回看',
        path: '/refund/review',
        icon: 'history',
        quickFilter: {}
      }
    ],
    [UserRole.DUTY_MANAGER]: [
      {
        id: 'dashboard',
        name: '运营概览',
        path: '/dashboard',
        icon: 'dashboard'
      },
      {
        id: 'exception-all',
        name: '全部异常处理',
        path: '/exception/all',
        icon: 'alert',
        quickFilter: {}
      },
      {
        id: 'refund-all',
        name: '全部退票记录',
        path: '/refund/all',
        icon: 'refund',
        quickFilter: {}
      },
      {
        id: 'hall-inspection',
        name: '影厅巡检',
        path: '/hall/inspection',
        icon: 'tool'
      },
      {
        id: 'exception-close',
        name: '异常关闭确认',
        path: '/exception/close',
        icon: 'check-square',
        quickFilter: {
          status: ScreeningExceptionStatus.RESOLVED
        }
      }
    ]
  };

  const menus = baseMenus[role] || [];
  return menus.map(menu => ({
    ...menu,
    badge: stats[menu.id] || { pendingCount: 0, stuckCount: 0 }
  }));
}
