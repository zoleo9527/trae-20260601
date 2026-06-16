import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Store {
  id: string
  name: string
  address: string
  manager: string
  region: string
}

export interface InspectionRecord {
  id: string
  storeId: string
  storeName: string
  inspector: string
  inspectDate: string
  status: 'pending' | 'completed' | 'overdue'
  items: InspectionItem[]
  summary: string
  createdAt: string
}

export interface InspectionItem {
  id: string
  category: string
  name: string
  standard: string
  result: 'pass' | 'fail' | 'pending'
  comment: string
  photos?: string[]
}

export interface RectificationTask {
  id: string
  inspectionId: string
  storeId: string
  storeName: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'completed' | 'verified'
  assignee: string
  assigneeRole: 'store_manager' | 'regional_supervisor' | 'purchaser'
  deadline: string
  createdAt: string
  updatedAt: string
  history: TaskHistory[]
}

export interface TaskHistory {
  id: string
  action: string
  operator: string
  operatorRole: string
  time: string
  comment?: string
}

export interface WarningRecord {
  id: string
  type: 'stock_shortage' | 'bad_review' | 'standard_deviation'
  storeId: string
  storeName: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  status: 'active' | 'resolved'
  createdAt: string
  resolvedAt?: string
  handledBy?: string
  handlingHistory: WarningHistory[]
}

export interface WarningHistory {
  id: string
  action: string
  operator: string
  operatorRole: string
  time: string
  comment?: string
}

export interface DailyReport {
  id: string
  storeId: string
  storeName: string
  reportDate: string
  sales: number
  customers: number
  avgCheck: number
  notes: string
  createdAt: string
}

export interface PurchaseRequest {
  id: string
  storeId: string
  storeName: string
  items: PurchaseItem[]
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requester: string
  createdAt: string
  updatedAt: string
  approvalHistory: ApprovalHistory[]
}

export interface PurchaseItem {
  id: string
  name: string
  quantity: number
  unit: string
  estimatedCost: number
}

export interface ApprovalHistory {
  id: string
  action: string
  operator: string
  operatorRole: string
  time: string
  comment?: string
}

export interface BadReview {
  id: string
  storeId: string
  storeName: string
  platform: string
  rating: number
  content: string
  response?: string
  respondedAt?: string
  createdAt: string
}

export const useInspectionStore = defineStore('inspection', () => {
  const stores = ref<Store[]>([
    { id: 's1', name: '望京SOHO店', address: '北京市朝阳区望京街10号', manager: '张经理', region: '北京' },
    { id: 's2', name: '中关村店', address: '北京市海淀区中关村大街1号', manager: '李经理', region: '北京' },
    { id: 's3', name: '国贸店', address: '北京市朝阳区建国门外大街1号', manager: '王经理', region: '北京' },
    { id: 's4', name: '陆家嘴店', address: '上海市浦东新区陆家嘴环路1000号', manager: '陈经理', region: '上海' },
    { id: 's5', name: '静安寺店', address: '上海市静安区南京西路1688号', manager: '刘经理', region: '上海' },
  ])

  const inspections = ref<InspectionRecord[]>([
    {
      id: 'i1',
      storeId: 's1',
      storeName: '望京SOHO店',
      inspector: '赵督导',
      inspectDate: '2026-06-15',
      status: 'completed',
      items: [
        { id: 'i1-1', category: '卫生', name: '厨房卫生', standard: '地面干净无油渍', result: 'pass', comment: '' },
        { id: 'i1-2', category: '卫生', name: '餐具消毒', standard: '每日消毒3次', result: 'pass', comment: '' },
        { id: 'i1-3', category: '服务', name: '员工着装', standard: '统一工装整洁', result: 'fail', comment: '部分员工未佩戴工牌' },
        { id: 'i1-4', category: '服务', name: '服务态度', standard: '热情周到', result: 'pass', comment: '' },
        { id: 'i1-5', category: '食品安全', name: '食材储存', standard: '分类存放温度达标', result: 'fail', comment: '冷藏柜温度偏高' },
        { id: 'i1-6', category: '运营', name: '库存管理', standard: '先进先出', result: 'pending', comment: '待复查' },
      ],
      summary: '整体情况良好，存在2项问题需整改',
      createdAt: '2026-06-15T09:00:00',
    },
    {
      id: 'i2',
      storeId: 's2',
      storeName: '中关村店',
      inspector: '赵督导',
      inspectDate: '2026-06-14',
      status: 'completed',
      items: [
        { id: 'i2-1', category: '卫生', name: '厨房卫生', standard: '地面干净无油渍', result: 'fail', comment: '地面有积水' },
        { id: 'i2-2', category: '卫生', name: '餐具消毒', standard: '每日消毒3次', result: 'pass', comment: '' },
        { id: 'i2-3', category: '服务', name: '员工着装', standard: '统一工装整洁', result: 'pass', comment: '' },
        { id: 'i2-4', category: '食品安全', name: '食材储存', standard: '分类存放温度达标', result: 'pass', comment: '' },
      ],
      summary: '存在1项卫生问题',
      createdAt: '2026-06-14T10:00:00',
    },
    {
      id: 'i3',
      storeId: 's3',
      storeName: '国贸店',
      inspector: '孙督导',
      inspectDate: '2026-06-16',
      status: 'pending',
      items: [
        { id: 'i3-1', category: '卫生', name: '厨房卫生', standard: '地面干净无油渍', result: 'pending', comment: '' },
        { id: 'i3-2', category: '服务', name: '员工培训', standard: '定期培训', result: 'pending', comment: '' },
        { id: 'i3-3', category: '食品安全', name: '食材新鲜度', standard: '当日食材当日使用', result: 'pending', comment: '' },
      ],
      summary: '巡店进行中',
      createdAt: '2026-06-16T08:30:00',
    },
    {
      id: 'i4',
      storeId: 's4',
      storeName: '陆家嘴店',
      inspector: '孙督导',
      inspectDate: '2026-06-12',
      status: 'overdue',
      items: [
        { id: 'i4-1', category: '卫生', name: '卫生间卫生', standard: '干净无异味', result: 'fail', comment: '异味明显' },
        { id: 'i4-2', category: '运营', name: '设备维护', standard: '定期保养', result: 'fail', comment: '空调故障未修复' },
      ],
      summary: '存在2项问题，整改逾期',
      createdAt: '2026-06-12T09:00:00',
    },
  ])

  const rectificationTasks = ref<RectificationTask[]>([
    {
      id: 'r1',
      inspectionId: 'i1',
      storeId: 's1',
      storeName: '望京SOHO店',
      title: '员工工牌佩戴',
      description: '部分员工未佩戴工牌，需立即整改',
      priority: 'medium',
      status: 'completed',
      assignee: '张经理',
      assigneeRole: 'store_manager',
      deadline: '2026-06-17',
      createdAt: '2026-06-15T10:00:00',
      updatedAt: '2026-06-16T14:00:00',
      history: [
        { id: 'h1', action: '创建任务', operator: '赵督导', operatorRole: '区域督导', time: '2026-06-15T10:00:00' },
        { id: 'h2', action: '接受任务', operator: '张经理', operatorRole: '店长', time: '2026-06-15T11:00:00' },
        { id: 'h3', action: '完成整改', operator: '张经理', operatorRole: '店长', time: '2026-06-16T14:00:00', comment: '已为所有员工配发工牌' },
      ],
    },
    {
      id: 'r2',
      inspectionId: 'i1',
      storeId: 's1',
      storeName: '望京SOHO店',
      title: '冷藏柜温度调整',
      description: '冷藏柜温度偏高，需调整至标准范围(2-8°C)',
      priority: 'high',
      status: 'processing',
      assignee: '张经理',
      assigneeRole: 'store_manager',
      deadline: '2026-06-18',
      createdAt: '2026-06-15T10:05:00',
      updatedAt: '2026-06-16T09:00:00',
      history: [
        { id: 'h4', action: '创建任务', operator: '赵督导', operatorRole: '区域督导', time: '2026-06-15T10:05:00' },
        { id: 'h5', action: '接受任务', operator: '张经理', operatorRole: '店长', time: '2026-06-15T11:30:00' },
        { id: 'h6', action: '开始整改', operator: '张经理', operatorRole: '店长', time: '2026-06-16T09:00:00', comment: '已联系维修人员' },
      ],
    },
    {
      id: 'r3',
      inspectionId: 'i4',
      storeId: 's4',
      storeName: '陆家嘴店',
      title: '卫生间异味处理',
      description: '卫生间存在异味，需彻底清洁并保持通风',
      priority: 'high',
      status: 'pending',
      assignee: '陈经理',
      assigneeRole: 'store_manager',
      deadline: '2026-06-14',
      createdAt: '2026-06-12T11:00:00',
      updatedAt: '2026-06-12T11:00:00',
      history: [
        { id: 'h7', action: '创建任务', operator: '孙督导', operatorRole: '区域督导', time: '2026-06-12T11:00:00' },
      ],
    },
    {
      id: 'r4',
      inspectionId: 'i4',
      storeId: 's4',
      storeName: '陆家嘴店',
      title: '空调维修',
      description: '空调故障需联系维修公司进行维修',
      priority: 'high',
      status: 'pending',
      assignee: '陈经理',
      assigneeRole: 'store_manager',
      deadline: '2026-06-14',
      createdAt: '2026-06-12T11:05:00',
      updatedAt: '2026-06-12T11:05:00',
      history: [
        { id: 'h8', action: '创建任务', operator: '孙督导', operatorRole: '区域督导', time: '2026-06-12T11:05:00' },
      ],
    },
    {
      id: 'r5',
      inspectionId: 'i2',
      storeId: 's2',
      storeName: '中关村店',
      title: '厨房地面清理',
      description: '厨房地面有积水，需及时清理并检查排水系统',
      priority: 'medium',
      status: 'verified',
      assignee: '李经理',
      assigneeRole: 'store_manager',
      deadline: '2026-06-15',
      createdAt: '2026-06-14T11:00:00',
      updatedAt: '2026-06-15T10:00:00',
      history: [
        { id: 'h9', action: '创建任务', operator: '赵督导', operatorRole: '区域督导', time: '2026-06-14T11:00:00' },
        { id: 'h10', action: '接受任务', operator: '李经理', operatorRole: '店长', time: '2026-06-14T11:30:00' },
        { id: 'h11', action: '完成整改', operator: '李经理', operatorRole: '店长', time: '2026-06-14T15:00:00', comment: '已清理地面并修复排水' },
        { id: 'h12', action: '验收通过', operator: '赵督导', operatorRole: '区域督导', time: '2026-06-15T10:00:00', comment: '复查合格' },
      ],
    },
  ])

  const warnings = ref<WarningRecord[]>([
    {
      id: 'w1',
      type: 'stock_shortage',
      storeId: 's1',
      storeName: '望京SOHO店',
      title: '食材短缺预警',
      description: '招牌红烧肉原材料库存不足，预计明日断货',
      severity: 'high',
      status: 'active',
      createdAt: '2026-06-16T08:00:00',
      handlingHistory: [],
    },
    {
      id: 'w2',
      type: 'bad_review',
      storeId: 's2',
      storeName: '中关村店',
      title: '外卖差评预警',
      description: '连续收到3条外卖差评，主要问题为送餐超时',
      severity: 'high',
      status: 'active',
      createdAt: '2026-06-16T09:30:00',
      handlingHistory: [],
    },
    {
      id: 'w3',
      type: 'standard_deviation',
      storeId: 's3',
      storeName: '国贸店',
      title: '执行标准不一',
      description: '饮品甜度与标准配方偏差超过20%',
      severity: 'medium',
      status: 'active',
      createdAt: '2026-06-16T10:00:00',
      handlingHistory: [],
    },
    {
      id: 'w4',
      type: 'stock_shortage',
      storeId: 's4',
      storeName: '陆家嘴店',
      title: '食材短缺预警',
      description: '蔬菜类库存不足，需及时补货',
      severity: 'medium',
      status: 'resolved',
      createdAt: '2026-06-15T07:00:00',
      resolvedAt: '2026-06-15T14:00:00',
      handledBy: '采购部',
      handlingHistory: [
        { id: 'wh1', action: '开始处理', operator: '采购专员', operatorRole: '采购', time: '2026-06-15T09:00:00' },
        { id: 'wh2', action: '已补货', operator: '采购专员', operatorRole: '采购', time: '2026-06-15T14:00:00', comment: '已安排供应商紧急补货' },
      ],
    },
    {
      id: 'w5',
      type: 'bad_review',
      storeId: 's5',
      storeName: '静安寺店',
      title: '外卖差评预警',
      description: '顾客反馈菜品口味偏咸',
      severity: 'low',
      status: 'active',
      createdAt: '2026-06-16T11:00:00',
      handlingHistory: [],
    },
  ])

  const dailyReports = ref<DailyReport[]>([
    { id: 'd1', storeId: 's1', storeName: '望京SOHO店', reportDate: '2026-06-15', sales: 12580, customers: 186, avgCheck: 67.6, notes: '周末客流较大', createdAt: '2026-06-15T22:00:00' },
    { id: 'd2', storeId: 's2', storeName: '中关村店', reportDate: '2026-06-15', sales: 8920, customers: 132, avgCheck: 67.6, notes: '雨天影响客流', createdAt: '2026-06-15T22:00:00' },
    { id: 'd3', storeId: 's3', storeName: '国贸店', reportDate: '2026-06-15', sales: 15680, customers: 215, avgCheck: 72.9, notes: '商务宴请较多', createdAt: '2026-06-15T22:00:00' },
  ])

  const purchaseRequests = ref<PurchaseRequest[]>([
    {
      id: 'p1',
      storeId: 's1',
      storeName: '望京SOHO店',
      items: [
        { id: 'pi1', name: '五花肉', quantity: 50, unit: '斤', estimatedCost: 800 },
        { id: 'pi2', name: '青菜', quantity: 30, unit: '斤', estimatedCost: 90 },
      ],
      status: 'approved',
      requester: '张经理',
      createdAt: '2026-06-16T09:00:00',
      updatedAt: '2026-06-16T10:30:00',
      approvalHistory: [
        { id: 'ah1', action: '提交申请', operator: '张经理', operatorRole: '店长', time: '2026-06-16T09:00:00' },
        { id: 'ah2', action: '批准申请', operator: '采购专员', operatorRole: '采购', time: '2026-06-16T10:30:00' },
      ],
    },
    {
      id: 'p2',
      storeId: 's4',
      storeName: '陆家嘴店',
      items: [
        { id: 'pi3', name: '蔬菜拼盘', quantity: 100, unit: '份', estimatedCost: 500 },
        { id: 'pi4', name: '食用油', quantity: 10, unit: '桶', estimatedCost: 500 },
      ],
      status: 'pending',
      requester: '陈经理',
      createdAt: '2026-06-16T11:00:00',
      updatedAt: '2026-06-16T11:00:00',
      approvalHistory: [
        { id: 'ah3', action: '提交申请', operator: '陈经理', operatorRole: '店长', time: '2026-06-16T11:00:00' },
      ],
    },
  ])

  const badReviews = ref<BadReview[]>([
    { id: 'br1', storeId: 's2', storeName: '中关村店', platform: '美团', rating: 1, content: '送餐超时30分钟，饭菜都凉了', response: '非常抱歉，我们会加强外卖配送管理', respondedAt: '2026-06-16T10:00:00', createdAt: '2026-06-16T09:20:00' },
    { id: 'br2', storeId: 's2', storeName: '中关村店', platform: '饿了么', rating: 1, content: '同样的菜比堂食差太多，明显偷工减料', createdAt: '2026-06-16T08:45:00' },
    { id: 'br3', storeId: 's5', storeName: '静安寺店', platform: '美团', rating: 2, content: '口味偏咸，希望改进', createdAt: '2026-06-16T10:30:00' },
  ])

  const currentRole = ref<'store_manager' | 'regional_supervisor' | 'purchaser'>('regional_supervisor')

  const pendingInspections = computed(() => inspections.value.filter(i => i.status === 'pending'))
  const completedInspections = computed(() => inspections.value.filter(i => i.status === 'completed'))
  const overdueInspections = computed(() => inspections.value.filter(i => i.status === 'overdue'))

  const pendingTasks = computed(() => rectificationTasks.value.filter(t => t.status === 'pending'))
  const processingTasks = computed(() => rectificationTasks.value.filter(t => t.status === 'processing'))
  const completedTasks = computed(() => rectificationTasks.value.filter(t => t.status === 'completed'))
  const verifiedTasks = computed(() => rectificationTasks.value.filter(t => t.status === 'verified'))

  const activeWarnings = computed(() => warnings.value.filter(w => w.status === 'active'))
  const resolvedWarnings = computed(() => warnings.value.filter(w => w.status === 'resolved'))

  const storeTasks = computed(() => rectificationTasks.value.filter(t => t.assigneeRole === 'store_manager'))
  const supervisorTasks = computed(() => rectificationTasks.value.filter(t => t.assigneeRole === 'regional_supervisor'))
  const purchaserTasks = computed(() => rectificationTasks.value.filter(t => t.assigneeRole === 'purchaser'))

  function setRole(role: 'store_manager' | 'regional_supervisor' | 'purchaser') {
    currentRole.value = role
  }

  function addInspection(inspection: Omit<InspectionRecord, 'id' | 'createdAt'>) {
    const newId = `i${Date.now()}`
    inspections.value.push({
      ...inspection,
      id: newId,
      createdAt: new Date().toISOString(),
    })
  }

  function updateInspectionStatus(id: string, status: InspectionRecord['status']) {
    const inspection = inspections.value.find(i => i.id === id)
    if (inspection) {
      inspection.status = status
    }
  }

  function addRectificationTask(task: Omit<RectificationTask, 'id' | 'createdAt' | 'updatedAt' | 'history'>) {
    const newId = `r${Date.now()}`
    const newTask: RectificationTask = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{
        id: `h${Date.now()}`,
        action: '创建任务',
        operator: currentRole.value === 'regional_supervisor' ? '督导' : '系统',
        operatorRole: currentRole.value === 'regional_supervisor' ? '区域督导' : '系统',
        time: new Date().toISOString(),
      }],
    }
    rectificationTasks.value.push(newTask)
  }

  function updateTaskStatus(id: string, status: RectificationTask['status'], comment?: string) {
    const task = rectificationTasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
      const actionMap: Record<RectificationTask['status'], string> = {
        pending: '重新分配',
        processing: '开始整改',
        completed: '完成整改',
        verified: '验收通过',
      }
      const currentOperator = currentRole.value === 'store_manager' ? '店长' : 
                             currentRole.value === 'regional_supervisor' ? '督导' : '采购'
      const currentOperatorRole = currentRole.value === 'store_manager' ? '店长' : 
                                  currentRole.value === 'regional_supervisor' ? '区域督导' : '采购'
      task.history.push({
        id: `h${Date.now()}`,
        action: actionMap[status],
        operator: currentOperator,
        operatorRole: currentOperatorRole,
        time: new Date().toISOString(),
        comment,
      })
    }
  }

  function resolveWarning(id: string, handledBy: string, comment?: string) {
    const warning = warnings.value.find(w => w.id === id)
    if (warning) {
      warning.status = 'resolved'
      warning.resolvedAt = new Date().toISOString()
      warning.handledBy = handledBy
      const currentOperator = currentRole.value === 'store_manager' ? '店长' : 
                             currentRole.value === 'regional_supervisor' ? '督导' : '采购'
      const currentOperatorRole = currentRole.value === 'store_manager' ? '店长' : 
                                  currentRole.value === 'regional_supervisor' ? '区域督导' : '采购'
      warning.handlingHistory.push({
        id: `wh${Date.now()}`,
        action: '已处理',
        operator: currentOperator,
        operatorRole: currentOperatorRole,
        time: new Date().toISOString(),
        comment,
      })
    }
  }

  function handleWarning(id: string, action: string, comment?: string) {
    const warning = warnings.value.find(w => w.id === id)
    if (warning) {
      const currentOperator = currentRole.value === 'store_manager' ? '店长' : 
                             currentRole.value === 'regional_supervisor' ? '督导' : '采购'
      const currentOperatorRole = currentRole.value === 'store_manager' ? '店长' : 
                                  currentRole.value === 'regional_supervisor' ? '区域督导' : '采购'
      warning.handlingHistory.push({
        id: `wh${Date.now()}`,
        action,
        operator: currentOperator,
        operatorRole: currentOperatorRole,
        time: new Date().toISOString(),
        comment,
      })
    }
  }

  function approvePurchaseRequest(id: string, comment?: string) {
    const request = purchaseRequests.value.find(p => p.id === id)
    if (request) {
      request.status = 'approved'
      request.updatedAt = new Date().toISOString()
      request.approvalHistory.push({
        id: `ah${Date.now()}`,
        action: '批准申请',
        operator: '采购专员',
        operatorRole: '采购',
        time: new Date().toISOString(),
        comment,
      })
    }
  }

  function rejectPurchaseRequest(id: string, comment?: string) {
    const request = purchaseRequests.value.find(p => p.id === id)
    if (request) {
      request.status = 'rejected'
      request.updatedAt = new Date().toISOString()
      request.approvalHistory.push({
        id: `ah${Date.now()}`,
        action: '拒绝申请',
        operator: '采购专员',
        operatorRole: '采购',
        time: new Date().toISOString(),
        comment,
      })
    }
  }

  function respondToReview(id: string, response: string) {
    const review = badReviews.value.find(r => r.id === id)
    if (review) {
      review.response = response
      review.respondedAt = new Date().toISOString()
    }
  }

  return {
    stores,
    inspections,
    rectificationTasks,
    warnings,
    dailyReports,
    purchaseRequests,
    badReviews,
    currentRole,
    pendingInspections,
    completedInspections,
    overdueInspections,
    pendingTasks,
    processingTasks,
    completedTasks,
    verifiedTasks,
    activeWarnings,
    resolvedWarnings,
    storeTasks,
    supervisorTasks,
    purchaserTasks,
    setRole,
    addInspection,
    updateInspectionStatus,
    addRectificationTask,
    updateTaskStatus,
    resolveWarning,
    handleWarning,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    respondToReview,
  }
})
