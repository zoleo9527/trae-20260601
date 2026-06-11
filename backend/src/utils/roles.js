const ROLES = {
  ROLE_MERCHANDISE_MANAGER: {
    code: 'ROLE_MERCHANDISE_MANAGER',
    name: '招商经理',
    permissions: [
      'lease:create', 'lease:edit:self', 'lease:submit:self',
      'lease:view:self',
      'deduction:create', 'deduction:edit:self',
      'log:view:self',
      'notification:view:self',
    ],
  },
  ROLE_OPERATION_SUPERVISOR: {
    code: 'ROLE_OPERATION_SUPERVISOR',
    name: '营运督导',
    permissions: [
      'lease:view:all', 'lease:confirm', 'lease:reject',
      'deduction:view:all', 'deduction:confirm', 'deduction:mark-liability',
      'log:view:all',
      'export:create',
      'notification:view:self',
    ],
  },
  ROLE_STORE_MANAGER: {
    code: 'ROLE_STORE_MANAGER',
    name: '品牌店长',
    permissions: [
      'lease:view:brand',
      'deduction:view:brand',
      'stock:report',
      'notification:view:self',
    ],
  },
  ROLE_SUPERVISOR: {
    code: 'ROLE_SUPERVISOR',
    name: '主管',
    permissions: [
      'lease:view:all',
      'deduction:view:all',
      'log:view:all',
      'export:create',
      'export:view:all',
      'dashboard:view',
      'notification:view:self',
    ],
  },
};

const hasPermission = (roleCode, permission) => {
  const role = ROLES[roleCode];
  if (!role) return false;
  return role.permissions.includes(permission);
};

const getRoleName = (roleCode) => ROLES[roleCode]?.name || roleCode;

module.exports = { ROLES, hasPermission, getRoleName };
