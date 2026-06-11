export const PLAN_STATUS = {
  PENDING: { value: 'PENDING', label: '待派单', type: 'info' },
  DISPATCHED: { value: 'DISPATCHED', label: '已派单', type: 'warning' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: '维保中', type: 'primary' },
  FOR_REVIEW: { value: 'FOR_REVIEW', label: '待审核', type: 'warning' },
  COMPLETED: { value: 'COMPLETED', label: '已完成', type: 'success' },
  REJECTED: { value: 'REJECTED', label: '已驳回', type: 'danger' }
}

export const CHECKIN_STATUS = {
  CHECKED_IN: { value: 'CHECKED_IN', label: '已签到', type: 'primary' },
  CHECKED_OUT: { value: 'CHECKED_OUT', label: '已签退', type: 'success' }
}

export const WORK_RESULT = {
  NORMAL: { value: 'NORMAL', label: '正常', type: 'success' },
  PROBLEM: { value: 'PROBLEM', label: '发现问题', type: 'warning' },
  REPAIRED: { value: 'REPAIRED', label: '已修复', type: 'primary' }
}

export const USER_ROLE = {
  SUPERVISOR: { value: 'SUPERVISOR', label: '项目主管' },
  CUSTOMER_SERVICE: { value: 'CUSTOMER_SERVICE', label: '客服' },
  TECHNICIAN: { value: 'TECHNICIAN', label: '维保技师' }
}

export const ACTION_TYPE = {
  CREATE: { value: 'CREATE', label: '创建计划' },
  DISPATCH: { value: 'DISPATCH', label: '派单' },
  CHECK_IN: { value: 'CHECK_IN', label: '签到' },
  CHECK_OUT: { value: 'CHECK_OUT', label: '签退' },
  REVIEW: { value: 'REVIEW', label: '审核' },
  NOTE: { value: 'NOTE', label: '添加备注' }
}

export const getPlanStatusLabel = (status) => {
  return PLAN_STATUS[status]?.label || status
}

export const getPlanStatusType = (status) => {
  return PLAN_STATUS[status]?.type || 'info'
}

export const getCheckinStatusLabel = (status) => {
  return CHECKIN_STATUS[status]?.label || status
}

export const getCheckinStatusType = (status) => {
  return CHECKIN_STATUS[status]?.type || 'info'
}

export const getWorkResultLabel = (result) => {
  return WORK_RESULT[result]?.label || result
}

export const getWorkResultType = (result) => {
  return WORK_RESULT[result]?.type || 'info'
}

export const getRoleLabel = (role) => {
  return USER_ROLE[role]?.label || role
}

export const getActionLabel = (action) => {
  return ACTION_TYPE[action]?.label || action
}
