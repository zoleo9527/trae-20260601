import { Role } from '@prisma/client';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    
    if (!userRole) {
      return res.status(401).json({ error: '未提供用户角色' });
    }
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: '无权访问此功能',
        required: allowedRoles,
        current: userRole
      });
    }
    
    req.userRole = userRole;
    next();
  };
}

export const rolePermissions = {
  [Role.EXHIBIT_EDUCATOR]: {
    canManageReservations: true,
    canViewSchedules: true,
    canUpdateOwnSchedule: true,
    canReportExhibitIssues: true,
    canHandleExhibitIssues: false,
    canHandleMaterialIssues: false,
    canReview: false
  },
  [Role.EQUIPMENT_ENGINEER]: {
    canManageReservations: false,
    canViewSchedules: true,
    canUpdateOwnSchedule: false,
    canReportExhibitIssues: true,
    canHandleExhibitIssues: true,
    canHandleMaterialIssues: false,
    canReview: true
  },
  [Role.ACTIVITY_TEACHER]: {
    canManageReservations: true,
    canViewSchedules: true,
    canUpdateOwnSchedule: true,
    canReportExhibitIssues: false,
    canHandleExhibitIssues: false,
    canHandleMaterialIssues: true,
    canReview: false
  },
  [Role.ADMIN]: {
    canManageReservations: true,
    canViewSchedules: true,
    canUpdateOwnSchedule: true,
    canReportExhibitIssues: true,
    canHandleExhibitIssues: true,
    canHandleMaterialIssues: true,
    canReview: true
  }
};
