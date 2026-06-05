import dayjs from 'dayjs'

export const ROLES = {
  FRONT_DESK: '前台',
  BELAYER: '保护员',
  ROUTE_ADMIN: '线路管理员',
}

export const ROUTE_OPEN_STATUS = {
  PENDING_BELAYER: 'pending_belayer',
  BELAYER_CONFIRMED: 'belayer_confirmed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const MAINTENANCE_STATUS = {
  PENDING_CONFIRM: 'pending_confirm',
  CONFIRMED: 'confirmed',
  CLOSED: 'closed',
}

export const ROUTE_OPEN_STATUS_LABEL = {
  pending_belayer: '待保护员确认',
  belayer_confirmed: '待线路管理员审核',
  approved: '已开放',
  rejected: '已驳回',
}

export const MAINTENANCE_STATUS_LABEL = {
  pending_confirm: '待保护员确认',
  confirmed: '已确认',
  closed: '已关闭',
}

export const GRADE_COLORS = {
  V0: '#4CAF50',
  V1: '#8BC34A',
  V2: '#CDDC39',
  V3: '#FFC107',
  V4: '#FF9800',
  V5: '#FF5722',
  V6: '#F44336',
  V7: '#9C27B0',
  V8: '#673AB7',
  V9: '#3F51B5',
  '5.6': '#4CAF50',
  '5.7': '#8BC34A',
  '5.8': '#CDDC39',
  '5.9': '#FFC107',
  '5.10a': '#FF9800',
  '5.10b': '#FF9800',
  '5.10c': '#FF5722',
  '5.10d': '#FF5722',
  '5.11a': '#F44336',
  '5.11b': '#F44336',
  '5.11c': '#9C27B0',
  '5.11d': '#9C27B0',
  '5.12a': '#673AB7',
}

export const ZONES = ['A区', 'B区', 'C区', 'D区', '顶绳区', '抱石区']

export const users = [
  { id: 'u1', name: '张晓丽', role: ROLES.FRONT_DESK, avatar: '👩‍💼' },
  { id: 'u2', name: '王强', role: ROLES.BELAYER, avatar: '🧗' },
  { id: 'u3', name: '李明', role: ROLES.BELAYER, avatar: '🧗' },
  { id: 'u4', name: '赵磊', role: ROLES.ROUTE_ADMIN, avatar: '🔧' },
  { id: 'u5', name: '陈静', role: ROLES.ROUTE_ADMIN, avatar: '🔧' },
]

export const routes = [
  { id: 'r1', name: '飞檐走壁', grade: 'V3', zone: 'A区', setter: '赵磊', setColor: '#FFC107', setDate: '2026-05-20' },
  { id: 'r2', name: '壁虎漫步', grade: 'V1', zone: 'A区', setter: '赵磊', setColor: '#8BC34A', setDate: '2026-05-18' },
  { id: 'r3', name: '云中漫步', grade: '5.10a', zone: '顶绳区', setter: '陈静', setColor: '#FF9800', setDate: '2026-05-22' },
  { id: 'r4', name: '蜘蛛侠', grade: 'V5', zone: 'B区', setter: '赵磊', setColor: '#FF5722', setDate: '2026-05-15' },
  { id: 'r5', name: '猫抓板', grade: 'V2', zone: '抱石区', setter: '陈静', setColor: '#CDDC39', setDate: '2026-05-25' },
  { id: 'r6', name: '天梯', grade: '5.11a', zone: '顶绳区', setter: '赵磊', setColor: '#F44336', setDate: '2026-05-10' },
  { id: 'r7', name: '冰裂纹', grade: 'V4', zone: 'C区', setter: '陈静', setColor: '#FF9800', setDate: '2026-05-28' },
  { id: 'r8', name: '青云直上', grade: '5.9', zone: 'D区', setter: '赵磊', setColor: '#FFC107', setDate: '2026-05-30' },
]

export const routeOpenings = [
  {
    id: 'ro1',
    routeId: 'r1',
    submittedBy: 'u1',
    submittedAt: '2026-06-01 09:30',
    status: ROUTE_OPEN_STATUS.APPROVED,
    belayerId: 'u2',
    belayerConfirmedAt: '2026-06-01 09:45',
    adminId: 'u4',
    adminApprovedAt: '2026-06-01 10:00',
    openDate: '2026-06-01',
    remark: '换点完成，确认安全',
  },
  {
    id: 'ro2',
    routeId: 'r4',
    submittedBy: 'u1',
    submittedAt: '2026-06-02 10:00',
    status: ROUTE_OPEN_STATUS.BELAYER_CONFIRMED,
    belayerId: 'u3',
    belayerConfirmedAt: '2026-06-02 10:20',
    adminId: null,
    adminApprovedAt: null,
    openDate: '2026-06-02',
    remark: '难点区重新布点',
  },
  {
    id: 'ro3',
    routeId: 'r5',
    submittedBy: 'u1',
    submittedAt: '2026-06-03 08:15',
    status: ROUTE_OPEN_STATUS.PENDING_BELAYER,
    belayerId: null,
    belayerConfirmedAt: null,
    adminId: null,
    adminApprovedAt: null,
    openDate: '2026-06-03',
    remark: '',
  },
  {
    id: 'ro4',
    routeId: 'r7',
    submittedBy: 'u1',
    submittedAt: '2026-05-30 14:00',
    status: ROUTE_OPEN_STATUS.REJECTED,
    belayerId: 'u2',
    belayerConfirmedAt: '2026-05-30 14:30',
    adminId: 'u5',
    adminApprovedAt: '2026-05-30 15:00',
    openDate: null,
    remark: '保护点磨损需更换',
  },
  {
    id: 'ro5',
    routeId: 'r3',
    submittedBy: 'u1',
    submittedAt: '2026-05-28 11:00',
    status: ROUTE_OPEN_STATUS.APPROVED,
    belayerId: 'u3',
    belayerConfirmedAt: '2026-05-28 11:20',
    adminId: 'u4',
    adminApprovedAt: '2026-05-28 11:40',
    openDate: '2026-05-28',
    remark: '',
  },
  {
    id: 'ro6',
    routeId: 'r8',
    submittedBy: 'u1',
    submittedAt: '2026-06-04 09:00',
    status: ROUTE_OPEN_STATUS.PENDING_BELAYER,
    belayerId: null,
    belayerConfirmedAt: null,
    adminId: null,
    adminApprovedAt: null,
    openDate: '2026-06-04',
    remark: '新线路首次开放',
  },
]

export const maintenanceRecords = [
  {
    id: 'm1',
    routeId: 'r1',
    type: '换点',
    description: '第3个手点松动，已更换',
    submittedBy: 'u4',
    submittedAt: '2026-06-01 08:00',
    status: MAINTENANCE_STATUS.CLOSED,
    confirmedBy: 'u2',
    confirmedAt: '2026-06-01 08:30',
    closedAt: '2026-06-01 09:00',
    attachments: ['换点前.jpg', '换点后.jpg'],
  },
  {
    id: 'm2',
    routeId: 'r4',
    type: '补漆',
    description: '起点标记褪色，重新标注颜色',
    submittedBy: 'u5',
    submittedAt: '2026-06-02 14:00',
    status: MAINTENANCE_STATUS.CONFIRMED,
    confirmedBy: 'u3',
    confirmedAt: '2026-06-02 14:30',
    closedAt: null,
    attachments: ['补漆完成.jpg'],
  },
  {
    id: 'm3',
    routeId: 'r6',
    type: '检查',
    description: '顶绳锚点年度检查',
    submittedBy: 'u4',
    submittedAt: '2026-06-03 09:00',
    status: MAINTENANCE_STATUS.PENDING_CONFIRM,
    confirmedBy: null,
    confirmedAt: null,
    closedAt: null,
    attachments: ['检查记录.pdf'],
  },
  {
    id: 'm4',
    routeId: 'r2',
    type: '换点',
    description: '第5个脚点脱落，重新安装',
    submittedBy: 'u5',
    submittedAt: '2026-05-29 10:00',
    status: MAINTENANCE_STATUS.CLOSED,
    confirmedBy: 'u2',
    confirmedAt: '2026-05-29 10:30',
    closedAt: '2026-05-29 11:00',
    attachments: [],
  },
  {
    id: 'm5',
    routeId: 'r7',
    type: '修复',
    description: '保护点磨损，需更换快挂',
    submittedBy: 'u4',
    submittedAt: '2026-05-30 14:00',
    status: MAINTENANCE_STATUS.CONFIRMED,
    confirmedBy: 'u3',
    confirmedAt: '2026-05-30 14:30',
    closedAt: null,
    attachments: ['磨损照片.jpg', '更换方案.pdf'],
  },
]

export const auditLogs = [
  { id: 'a1', type: 'route_open', refId: 'ro1', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-06-01 09:30', detail: '线路：飞檐走壁 (V3)' },
  { id: 'a2', type: 'route_open', refId: 'ro1', action: '保护员确认', operatorId: 'u2', timestamp: '2026-06-01 09:45', detail: '确认安全检查通过' },
  { id: 'a3', type: 'route_open', refId: 'ro1', action: '线路管理员审核通过', operatorId: 'u4', timestamp: '2026-06-01 10:00', detail: '线路正式开放' },
  { id: 'a4', type: 'maintenance', refId: 'm1', action: '提交维护记录', operatorId: 'u4', timestamp: '2026-06-01 08:00', detail: '换点 - 第3个手点松动' },
  { id: 'a5', type: 'maintenance', refId: 'm1', action: '保护员确认维护', operatorId: 'u2', timestamp: '2026-06-01 08:30', detail: '已确认换点完成' },
  { id: 'a6', type: 'maintenance', refId: 'm1', action: '关闭维护记录', operatorId: 'u4', timestamp: '2026-06-01 09:00', detail: '维护完成，线路恢复' },
  { id: 'a7', type: 'route_open', refId: 'ro2', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-06-02 10:00', detail: '线路：蜘蛛侠 (V5)' },
  { id: 'a8', type: 'route_open', refId: 'ro2', action: '保护员确认', operatorId: 'u3', timestamp: '2026-06-02 10:20', detail: '确认安全' },
  { id: 'a9', type: 'route_open', refId: 'ro4', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-05-30 14:00', detail: '线路：冰裂纹 (V4)' },
  { id: 'a10', type: 'route_open', refId: 'ro4', action: '线路管理员驳回', operatorId: 'u5', timestamp: '2026-05-30 15:00', detail: '保护点磨损需更换' },
  { id: 'a11', type: 'maintenance', refId: 'm2', action: '提交维护记录', operatorId: 'u5', timestamp: '2026-06-02 14:00', detail: '补漆 - 起点标记' },
  { id: 'a12', type: 'maintenance', refId: 'm2', action: '保护员确认维护', operatorId: 'u3', timestamp: '2026-06-02 14:30', detail: '确认补漆完成' },
  { id: 'a13', type: 'route_open', refId: 'ro3', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-06-03 08:15', detail: '线路：猫抓板 (V2)' },
  { id: 'a14', type: 'maintenance', refId: 'm3', action: '提交维护记录', operatorId: 'u4', timestamp: '2026-06-03 09:00', detail: '检查 - 顶绳锚点年度检查' },
  { id: 'a15', type: 'maintenance', refId: 'm5', action: '提交维护记录', operatorId: 'u4', timestamp: '2026-05-30 14:00', detail: '修复 - 保护点磨损' },
  { id: 'a16', type: 'maintenance', refId: 'm5', action: '保护员确认维护', operatorId: 'u3', timestamp: '2026-05-30 14:30', detail: '确认磨损情况' },
  { id: 'a17', type: 'route_open', refId: 'ro5', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-05-28 11:00', detail: '线路：云中漫步 (5.10a)' },
  { id: 'a18', type: 'route_open', refId: 'ro5', action: '保护员确认', operatorId: 'u3', timestamp: '2026-05-28 11:20', detail: '确认安全' },
  { id: 'a19', type: 'route_open', refId: 'ro5', action: '线路管理员审核通过', operatorId: 'u4', timestamp: '2026-05-28 11:40', detail: '线路正式开放' },
  { id: 'a20', type: 'route_open', refId: 'ro6', action: '提交线路开放申请', operatorId: 'u1', timestamp: '2026-06-04 09:00', detail: '线路：青云直上 (5.9)' },
]

export function getUserById(id) {
  return users.find(u => u.id === id) || null
}

export function getRouteById(id) {
  return routes.find(r => r.id === id) || null
}

export function getAuditLogsByRef(refId) {
  return auditLogs.filter(l => l.refId === refId).sort((a, b) => dayjs(a.timestamp).isBefore(dayjs(b.timestamp)) ? -1 : 1)
}
