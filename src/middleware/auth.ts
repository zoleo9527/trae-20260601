import { Request, Response, NextFunction } from 'express';
import { UserRole, ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  };
}

const userDatabase: Record<string, { id: string; username: string; name: string; role: UserRole }> = {
  'schedule-manager': {
    id: 'user-schedule-001',
    username: 'schedule_mgr',
    name: '张伟',
    role: UserRole.SCHEDULE_MANAGER
  },
  'ticket-supervisor': {
    id: 'user-ticket-001',
    username: 'ticket_sup',
    name: '李娜',
    role: UserRole.TICKET_SUPERVISOR
  },
  'duty-manager': {
    id: 'user-duty-001',
    username: 'duty_mgr',
    name: '王强',
    role: UserRole.DUTY_MANAGER
  }
};

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userKey = req.headers['x-user-key'] as string;
  
  if (!userKey || !userDatabase[userKey]) {
    const response: ApiResponse = {
      code: 401,
      message: '未授权访问，请使用有效的用户标识',
      data: null
    };
    return res.status(401).json(response);
  }
  
  req.user = userDatabase[userKey];
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const response: ApiResponse = {
        code: 403,
        message: '权限不足，无法执行此操作',
        data: { requiredRoles: roles, currentRole: req.user?.role }
      };
      return res.status(403).json(response);
    }
    next();
  };
}

export function getRoleMenu(role: UserRole) {
  const menus = {
    [UserRole.SCHEDULE_MANAGER]: [
      { id: 'schedule', name: '排片管理', path: '/schedule' },
      { id: 'exception-report', name: '放映异常上报', path: '/exception/report' },
      { id: 'exception-list', name: '放映异常列表', path: '/exception/list' },
      { id: 'hall-change', name: '临时换厅处理', path: '/exception/hall-change' }
    ],
    [UserRole.TICKET_SUPERVISOR]: [
      { id: 'refund-list', name: '退票申请列表', path: '/refund/list' },
      { id: 'refund-audit', name: '退票审核', path: '/refund/audit' },
      { id: 'group-ticket', name: '团体票核销', path: '/group-ticket' },
      { id: 'refund-review', name: '退票处理回看', path: '/refund/review' }
    ],
    [UserRole.DUTY_MANAGER]: [
      { id: 'dashboard', name: '运营概览', path: '/dashboard' },
      { id: 'exception-all', name: '全部异常处理', path: '/exception/all' },
      { id: 'refund-all', name: '全部退票记录', path: '/refund/all' },
      { id: 'hall-inspection', name: '影厅巡检', path: '/hall/inspection' },
      { id: 'exception-close', name: '异常关闭确认', path: '/exception/close' }
    ]
  };
  return menus[role] || [];
}
