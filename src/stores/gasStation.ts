import type { AbnormalRepair, DeviceInspection, InspectionStatus, RepairStatus, StatusLog, User, UserRole } from '@/types'
import { defineStore } from 'pinia'

const demoUsers: User[] = [
  { id: 'u1', name: '张站长', role: 'station_master', phone: '13800000001', avatar: '👨‍💼' },
  { id: 'u2', name: '李收银', role: 'cashier', phone: '13800000002', avatar: '👩‍💻' },
  { id: 'u3', name: '王计量', role: 'gauge_officer', phone: '13800000003', avatar: '👨‍🔧' }
]

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString()

const initialInspections: DeviceInspection[] = [
  {
    id: 'insp1',
    inspectionNo: 'XJ-2026-0601-001',
    deviceName: '1号加油机',
    deviceCode: 'YJ-001',
    location: '加油岛A区',
    inspectorId: 'u3',
    inspectorName: '王计量',
    scheduledDate: daysAgo(6),
    actualDate: daysAgo(6),
    status: 'completed',
    items: [
      { id: 'i1', name: '油枪出油情况', category: '加油系统', result: 'normal', remark: '出油顺畅' },
      { id: 'i2', name: '计量准确度', category: '计量系统', result: 'normal', remark: '误差在允许范围内' },
      { id: 'i3', name: '外观清洁度', category: '外观', result: 'normal', remark: '清洁良好' }
    ],
    overallRemark: '设备运行正常，无异常',
    statusLogs: [
      { id: 'sl1', timestamp: daysAgo(6), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'pending', toStatus: 'in_progress', remark: '开始巡检' },
      { id: 'sl2', timestamp: hoursAgo(6 * 24 + 2), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'in_progress', toStatus: 'completed', remark: '巡检完成，一切正常' }
    ],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(6)
  },
  {
    id: 'insp2',
    inspectionNo: 'XJ-2026-0603-002',
    deviceName: '2号加油机',
    deviceCode: 'YJ-002',
    location: '加油岛A区',
    inspectorId: 'u3',
    inspectorName: '王计量',
    scheduledDate: daysAgo(4),
    actualDate: daysAgo(4),
    status: 'abnormal',
    items: [
      { id: 'i1', name: '油枪出油情况', category: '加油系统', result: 'abnormal', remark: '3号油枪出油缓慢，有顿挫感' },
      { id: 'i2', name: '计量准确度', category: '计量系统', result: 'normal', remark: '正常' },
      { id: 'i3', name: '显示屏状态', category: '电子系统', result: 'normal', remark: '显示正常' }
    ],
    overallRemark: '3号油枪出油异常，已提交报修',
    statusLogs: [
      { id: 'sl1', timestamp: daysAgo(4), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'pending', toStatus: 'in_progress', remark: '开始巡检' },
      { id: 'sl2', timestamp: hoursAgo(4 * 24 + 1), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'in_progress', toStatus: 'abnormal', remark: '发现3号油枪出油异常，创建报修单WX-2026-0603-001' },
      { id: 'sl3', timestamp: hoursAgo(4 * 24 + 3), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'abnormal', toStatus: 'abnormal', remark: '已确认异常，安排维修' }
    ],
    relatedRepairId: 'repair1',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4)
  },
  {
    id: 'insp3',
    inspectionNo: 'XJ-2026-0605-003',
    deviceName: '储油罐A',
    deviceCode: 'CG-001',
    location: '油罐区',
    inspectorId: 'u3',
    inspectorName: '王计量',
    scheduledDate: daysAgo(2),
    actualDate: daysAgo(2),
    status: 'recheck',
    items: [
      { id: 'i1', name: '液位计读数', category: '计量系统', result: 'normal', remark: '读数正常' },
      { id: 'i2', name: '罐体密封性', category: '安全', result: 'normal', remark: '无渗漏' },
      { id: 'i3', name: '呼吸阀状态', category: '安全', result: 'abnormal', remark: '呼吸阀有轻微堵塞' }
    ],
    overallRemark: '呼吸阀需要清理，已安排复检',
    statusLogs: [
      { id: 'sl1', timestamp: daysAgo(2), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'pending', toStatus: 'in_progress', remark: '开始巡检' },
      { id: 'sl2', timestamp: hoursAgo(2 * 24 + 1), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'in_progress', toStatus: 'abnormal', remark: '呼吸阀异常' },
      { id: 'sl3', timestamp: hoursAgo(2 * 24 + 5), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'abnormal', toStatus: 'recheck', remark: '先自行清理，3天后复检' }
    ],
    relatedRepairId: 'repair2',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },
  {
    id: 'insp4',
    inspectionNo: 'XJ-2026-0606-004',
    deviceName: '3号加油机',
    deviceCode: 'YJ-003',
    location: '加油岛B区',
    inspectorId: 'u3',
    inspectorName: '王计量',
    scheduledDate: daysAgo(1),
    actualDate: '',
    status: 'pending',
    items: [
      { id: 'i1', name: '油枪出油情况', category: '加油系统', result: 'na', remark: '' },
      { id: 'i2', name: '计量准确度', category: '计量系统', result: 'na', remark: '' },
      { id: 'i3', name: '支付系统', category: '电子系统', result: 'na', remark: '' }
    ],
    overallRemark: '',
    statusLogs: [
      { id: 'sl1', timestamp: daysAgo(1), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: '', toStatus: 'pending', remark: '创建巡检任务' }
    ],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    id: 'insp5',
    inspectionNo: 'XJ-2026-0607-005',
    deviceName: '柴油发电机',
    deviceCode: 'FD-001',
    location: '配电室',
    inspectorId: 'u3',
    inspectorName: '王计量',
    scheduledDate: now.toISOString(),
    actualDate: '',
    status: 'pending',
    items: [
      { id: 'i1', name: '启动测试', category: '动力系统', result: 'na', remark: '' },
      { id: 'i2', name: '机油油位', category: '润滑系统', result: 'na', remark: '' },
      { id: 'i3', name: '输出电压', category: '电气系统', result: 'na', remark: '' }
    ],
    overallRemark: '',
    statusLogs: [
      { id: 'sl1', timestamp: hoursAgo(2), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: '', toStatus: 'pending', remark: '创建巡检任务' }
    ],
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2)
  }
]

const initialRepairs: AbnormalRepair[] = [
  {
    id: 'repair1',
    repairNo: 'WX-2026-0603-001',
    deviceName: '2号加油机-3号油枪',
    deviceCode: 'YJ-002-Q3',
    location: '加油岛A区',
    reporterId: 'u3',
    reporterName: '王计量',
    reporterRole: 'gauge_officer',
    assigneeId: 'u1',
    assigneeName: '张站长',
    reportedAt: daysAgo(4),
    priority: 'high',
    abnormalDescription: '3号油枪出油缓慢，有明显顿挫感，客户投诉加油时间过长',
    status: 'in_progress',
    statusLogs: [
      { id: 'rsl1', timestamp: daysAgo(4), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: '', toStatus: 'submitted', remark: '巡检发现异常，提交报修' },
      { id: 'rsl2', timestamp: hoursAgo(4 * 24 + 2), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'submitted', toStatus: 'assigned', remark: '已受理，安排维修人员明天到场' },
      { id: 'rsl3', timestamp: hoursAgo(3 * 24 + 8), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'assigned', toStatus: 'in_progress', remark: '维修人员已到场，开始拆检' }
    ],
    relatedInspectionId: 'insp2',
    inspectionUpdates: [
      {
        timestamp: daysAgo(4),
        inspectionId: 'insp2',
        inspectionStatus: 'abnormal',
        inspectionRemark: '发现3号油枪出油异常，创建报修单',
        operatorName: '王计量'
      },
      {
        timestamp: hoursAgo(4 * 24 + 3),
        inspectionId: 'insp2',
        inspectionStatus: 'abnormal',
        inspectionRemark: '站长已确认异常，安排维修',
        operatorName: '张站长'
      }
    ],
    repairProgress: '已拆开油枪，发现过滤器堵塞严重，正在更换备件',
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(3 * 24 + 8)
  },
  {
    id: 'repair2',
    repairNo: 'WX-2026-0605-002',
    deviceName: '储油罐A-呼吸阀',
    deviceCode: 'CG-001-HX',
    location: '油罐区',
    reporterId: 'u3',
    reporterName: '王计量',
    reporterRole: 'gauge_officer',
    assigneeId: 'u3',
    assigneeName: '王计量',
    reportedAt: daysAgo(2),
    priority: 'medium',
    abnormalDescription: '呼吸阀有轻微堵塞，通气不畅，需要清理',
    status: 'waiting_parts',
    statusLogs: [
      { id: 'rsl1', timestamp: daysAgo(2), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: '', toStatus: 'submitted', remark: '巡检发现呼吸阀异常' },
      { id: 'rsl2', timestamp: hoursAgo(2 * 24 + 3), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'submitted', toStatus: 'assigned', remark: '安排先自行清理，如不行再叫外部维修' },
      { id: 'rsl3', timestamp: hoursAgo(2 * 24 + 6), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'assigned', toStatus: 'waiting_parts', remark: '清理后仍有问题，需要更换密封垫，已采购' }
    ],
    relatedInspectionId: 'insp3',
    inspectionUpdates: [
      {
        timestamp: daysAgo(2),
        inspectionId: 'insp3',
        inspectionStatus: 'abnormal',
        inspectionRemark: '呼吸阀异常，提交报修',
        operatorName: '王计量'
      },
      {
        timestamp: hoursAgo(2 * 24 + 5),
        inspectionId: 'insp3',
        inspectionStatus: 'recheck',
        inspectionRemark: '站长安排自行清理后复检',
        operatorName: '张站长'
      }
    ],
    repairProgress: '已采购密封垫，预计明天到货后更换',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(2 * 24 + 6)
  },
  {
    id: 'repair3',
    repairNo: 'WX-2026-0602-003',
    deviceName: '便利店POS机',
    deviceCode: 'POS-001',
    location: '收银台',
    reporterId: 'u2',
    reporterName: '李收银',
    reporterRole: 'cashier',
    assigneeId: 'u1',
    assigneeName: '张站长',
    reportedAt: daysAgo(5),
    priority: 'medium',
    abnormalDescription: 'POS机扫码枪有时识别不了条码，反应迟钝',
    status: 'verified',
    statusLogs: [
      { id: 'rsl1', timestamp: daysAgo(5), userId: 'u2', userName: '李收银', userRole: 'cashier', fromStatus: '', toStatus: 'submitted', remark: '扫码枪识别不灵敏' },
      { id: 'rsl2', timestamp: hoursAgo(5 * 24 + 3), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'submitted', toStatus: 'assigned', remark: '联系供应商技术支持' },
      { id: 'rsl3', timestamp: daysAgo(3), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'assigned', toStatus: 'completed', remark: '供应商远程更新固件，问题解决' },
      { id: 'rsl4', timestamp: daysAgo(2), userId: 'u2', userName: '李收银', userRole: 'cashier', fromStatus: 'completed', toStatus: 'verified', remark: '使用两天，扫码恢复正常，确认修复' }
    ],
    inspectionUpdates: [],
    repairProgress: '',
    solution: '更新扫码枪固件，优化识别算法',
    completedAt: daysAgo(3),
    verifierId: 'u2',
    verifierName: '李收银',
    verifiedAt: daysAgo(2),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2)
  },
  {
    id: 'repair4',
    repairNo: 'WX-2026-0601-004',
    deviceName: '1号加油机显示屏',
    deviceCode: 'YJ-001-DISP',
    location: '加油岛A区',
    reporterId: 'u2',
    reporterName: '李收银',
    reporterRole: 'cashier',
    assigneeId: 'u1',
    assigneeName: '张站长',
    reportedAt: daysAgo(6),
    priority: 'low',
    abnormalDescription: '显示屏亮度有点暗，阳光下看不清楚',
    status: 'closed',
    statusLogs: [
      { id: 'rsl1', timestamp: daysAgo(6), userId: 'u2', userName: '李收银', userRole: 'cashier', fromStatus: '', toStatus: 'submitted', remark: '显示屏亮度不足' },
      { id: 'rsl2', timestamp: hoursAgo(6 * 24 + 4), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'submitted', toStatus: 'assigned', remark: '调整亮度设置' },
      { id: 'rsl3', timestamp: hoursAgo(6 * 24 + 5), userId: 'u3', userName: '王计量', userRole: 'gauge_officer', fromStatus: 'assigned', toStatus: 'completed', remark: '已将亮度调至最高，清洁了屏幕' },
      { id: 'rsl4', timestamp: daysAgo(5), userId: 'u2', userName: '李收银', userRole: 'cashier', fromStatus: 'completed', toStatus: 'verified', remark: '亮度有所改善，可以接受' },
      { id: 'rsl5', timestamp: daysAgo(4), userId: 'u1', userName: '张站长', userRole: 'station_master', fromStatus: 'verified', toStatus: 'closed', remark: '归档关闭' }
    ],
    inspectionUpdates: [],
    repairProgress: '',
    solution: '调高显示屏亮度并清洁屏幕',
    completedAt: hoursAgo(6 * 24 + 5),
    verifierId: 'u2',
    verifierName: '李收银',
    verifiedAt: daysAgo(5),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4)
  }
]

export const useGasStationStore = defineStore('gasStation', {
  state: () => ({
    currentUser: demoUsers[0] as User,
    users: demoUsers as User[],
    inspections: initialInspections as DeviceInspection[],
    repairs: initialRepairs as AbnormalRepair[]
  }),

  getters: {
    inspectionsByStatus: (state) => {
      return (status?: InspectionStatus) => {
        if (!status) return state.inspections
        return state.inspections.filter(i => i.status === status)
      }
    },
    repairsByStatus: (state) => {
      return (status?: RepairStatus) => {
        if (!status) return state.repairs
        return state.repairs.filter(r => r.status === status)
      }
    },
    getInspectionById: (state) => {
      return (id: string) => state.inspections.find(i => i.id === id)
    },
    getRepairById: (state) => {
      return (id: string) => state.repairs.find(r => r.id === id)
    },
    roleLabel: () => (role: UserRole) => {
      const map: Record<UserRole, string> = {
        station_master: '站长',
        cashier: '收银员',
        gauge_officer: '计量员'
      }
      return map[role]
    },
    inspectionStatusLabel: () => (status: InspectionStatus) => {
      const map: Record<InspectionStatus, string> = {
        pending: '待巡检',
        in_progress: '巡检中',
        completed: '已完成',
        abnormal: '异常',
        recheck: '待复检'
      }
      return map[status]
    },
    repairStatusLabel: () => (status: RepairStatus) => {
      const map: Record<RepairStatus, string> = {
        submitted: '已提交',
        assigned: '已指派',
        in_progress: '处理中',
        waiting_parts: '待备件',
        completed: '已完成',
        verified: '已验证',
        closed: '已关闭'
      }
      return map[status]
    },
    canCreateInspection: (state) => {
      return state.currentUser.role === 'station_master'
    },
    canAssignInspection: (state) => {
      return state.currentUser.role === 'station_master'
    },
    canExecuteInspection: (state) => {
      return state.currentUser.role === 'gauge_officer'
    },
    canReviewInspection: (state) => {
      return state.currentUser.role === 'station_master'
    },
    canSubmitRepair: (state) => {
      return ['cashier', 'gauge_officer'].includes(state.currentUser.role)
    },
    canAssignRepair: (state) => {
      return state.currentUser.role === 'station_master'
    },
    canProcessRepair: (state) => {
      return state.currentUser.role === 'station_master' || state.currentUser.role === 'gauge_officer'
    },
    canVerifyRepair: (state) => {
      return state.currentUser.role === 'cashier' || state.currentUser.role === 'station_master'
    },
    canCloseRepair: (state) => {
      return state.currentUser.role === 'station_master'
    },
    canEditInspection: (state) => {
      return (inspectionId: string) => {
        const inspection = state.inspections.find(i => i.id === inspectionId)
        if (!inspection) return false
        if (state.currentUser.role === 'station_master') return true
        if (state.currentUser.role === 'gauge_officer' && inspection.inspectorId === state.currentUser.id) {
          return ['pending', 'in_progress', 'recheck'].includes(inspection.status)
        }
        return false
      }
    },
    canEditRepair: (state) => {
      return (repairId: string) => {
        const repair = state.repairs.find(r => r.id === repairId)
        if (!repair) return false
        if (state.currentUser.role === 'station_master') return true
        if (state.currentUser.role === 'gauge_officer' && repair.assigneeId === state.currentUser.id) {
          return ['assigned', 'in_progress', 'waiting_parts'].includes(repair.status)
        }
        return false
      }
    },
    myPendingInspections: (state) => {
      return state.inspections.filter(i => {
        if (state.currentUser.role === 'gauge_officer') {
          return i.inspectorId === state.currentUser.id && ['pending', 'recheck'].includes(i.status)
        }
        if (state.currentUser.role === 'station_master') {
          return ['abnormal'].includes(i.status)
        }
        return false
      })
    },
    myPendingRepairs: (state) => {
      return state.repairs.filter(r => {
        if (state.currentUser.role === 'station_master') {
          return ['submitted', 'completed'].includes(r.status)
        }
        if (state.currentUser.role === 'gauge_officer') {
          return r.assigneeId === state.currentUser.id && ['assigned', 'in_progress', 'waiting_parts'].includes(r.status)
        }
        if (state.currentUser.role === 'cashier') {
          return r.reporterId === state.currentUser.id && ['completed'].includes(r.status)
        }
        return false
      })
    }
  },

  actions: {
    switchUser(userId: string) {
      const user = this.users.find(u => u.id === userId)
      if (user) {
        this.currentUser = user
      }
    },

    updateInspectionStatus(inspectionId: string, newStatus: InspectionStatus, remark: string) {
      const inspection = this.inspections.find(i => i.id === inspectionId)
      if (!inspection) return

      const log: StatusLog = {
        id: 'sl-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        userRole: this.currentUser.role,
        fromStatus: inspection.status,
        toStatus: newStatus,
        remark
      }

      inspection.statusLogs.push(log)
      inspection.status = newStatus
      inspection.updatedAt = new Date().toISOString()
      if (newStatus === 'in_progress' && !inspection.actualDate) {
        inspection.actualDate = new Date().toISOString()
      }

      if (inspection.relatedRepairId) {
        this.syncInspectionToRepair(inspection)
      }
    },

    updateInspectionRemark(inspectionId: string, remark: string) {
      const inspection = this.inspections.find(i => i.id === inspectionId)
      if (!inspection) return
      const oldRemark = inspection.overallRemark
      inspection.overallRemark = remark
      inspection.updatedAt = new Date().toISOString()

      if (inspection.relatedRepairId && oldRemark !== remark) {
        this.syncInspectionToRepair(inspection, '更新备注')
      }
    },

    updateInspectionItem(inspectionId: string, itemId: string, result: 'normal' | 'abnormal' | 'na', remark: string) {
      const inspection = this.inspections.find(i => i.id === inspectionId)
      if (!inspection) return
      const item = inspection.items.find(it => it.id === itemId)
      if (item) {
        item.result = result
        item.remark = remark
        inspection.updatedAt = new Date().toISOString()
      }
    },

    syncInspectionToRepair(inspection: DeviceInspection, actionType?: string) {
      if (!inspection.relatedRepairId) return
      const repair = this.repairs.find(r => r.id === inspection.relatedRepairId)
      if (!repair) return

      const lastLog = inspection.statusLogs[inspection.statusLogs.length - 1]
      const remark = actionType 
        ? `${actionType}: ${lastLog?.remark || inspection.overallRemark || ''}`
        : (lastLog?.remark || inspection.overallRemark || '')
      
      repair.inspectionUpdates.push({
        timestamp: new Date().toISOString(),
        inspectionId: inspection.id,
        inspectionStatus: inspection.status,
        inspectionRemark: remark,
        operatorName: this.currentUser.name
      })
      repair.updatedAt = new Date().toISOString()
    },

    updateRepairStatus(repairId: string, newStatus: RepairStatus, remark: string) {
      const repair = this.repairs.find(r => r.id === repairId)
      if (!repair) return

      const log: StatusLog = {
        id: 'rsl-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        userRole: this.currentUser.role,
        fromStatus: repair.status,
        toStatus: newStatus,
        remark
      }

      repair.statusLogs.push(log)
      repair.status = newStatus
      repair.updatedAt = new Date().toISOString()

      if (newStatus === 'completed') {
        repair.completedAt = new Date().toISOString()
      }
      if (newStatus === 'verified') {
        repair.verifierId = this.currentUser.id
        repair.verifierName = this.currentUser.name
        repair.verifiedAt = new Date().toISOString()
      }
    },

    updateRepairProgress(repairId: string, progress: string, solution?: string) {
      const repair = this.repairs.find(r => r.id === repairId)
      if (!repair) return
      repair.repairProgress = progress
      if (solution) repair.solution = solution
      repair.updatedAt = new Date().toISOString()
    },

    createRepairFromInspection(inspectionId: string, priority: AbnormalRepair['priority'], description: string) {
      const inspection = this.inspections.find(i => i.id === inspectionId)
      if (!inspection) return null

      const repairNo = 'WX-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(this.repairs.length + 1).padStart(3, '0')
      
      const newRepair: AbnormalRepair = {
        id: 'repair-' + Date.now(),
        repairNo,
        deviceName: inspection.deviceName,
        deviceCode: inspection.deviceCode,
        location: inspection.location,
        reporterId: this.currentUser.id,
        reporterName: this.currentUser.name,
        reporterRole: this.currentUser.role,
        reportedAt: new Date().toISOString(),
        priority,
        abnormalDescription: description,
        status: 'submitted',
        statusLogs: [
          {
            id: 'rsl-' + Date.now(),
            timestamp: new Date().toISOString(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            fromStatus: '',
            toStatus: 'submitted',
            remark: `从巡检单${inspection.inspectionNo}创建报修`
          }
        ],
        relatedInspectionId: inspection.id,
        inspectionUpdates: [
          {
            timestamp: new Date().toISOString(),
            inspectionId: inspection.id,
            inspectionStatus: inspection.status,
            inspectionRemark: '从巡检创建报修单',
            operatorName: this.currentUser.name
          }
        ],
        repairProgress: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.repairs.unshift(newRepair)
      inspection.relatedRepairId = newRepair.id
      inspection.updatedAt = new Date().toISOString()

      return newRepair
    }
  }
})
