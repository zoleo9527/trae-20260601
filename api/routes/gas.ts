import express from 'express'
import type {
  GasApplication,
  CustomerVisit,
  SafetyCheck,
  HiddenDanger,
  MeterChange,
  Customer,
  GasRole,
  ApplicationStatus,
  VisitStatus,
  HiddenDangerLevel,
  RecordStatus
} from '../../src/types/gas'

const router = express.Router()

const customers: Customer[] = [
  { id: 'c1', name: '张三', phone: '13800138001', address: '北京市朝阳区幸福小区1号楼101室', meter_number: 'M2024001', gas_type: '天然气' },
  { id: 'c2', name: '李四', phone: '13800138002', address: '北京市朝阳区幸福小区1号楼102室', meter_number: 'M2024002', gas_type: '天然气' },
  { id: 'c3', name: '王五', phone: '13800138003', address: '北京市朝阳区幸福小区2号楼201室', meter_number: 'M2024003', gas_type: '天然气' },
  { id: 'c4', name: '赵六', phone: '13800138004', address: '北京市朝阳区幸福小区2号楼202室', meter_number: 'M2024004', gas_type: '天然气' },
  { id: 'c5', name: '孙七', phone: '13800138005', address: '北京市朝阳区幸福小区3号楼301室', meter_number: 'M2024005', gas_type: '天然气' },
  { id: 'c6', name: '周八', phone: '13800138006', address: '北京市朝阳区幸福小区3号楼302室', meter_number: 'M2024006', gas_type: '天然气' },
]

const gasApplications: GasApplication[] = [
  {
    id: 'ga001',
    customer_id: 'c1',
    customer_name: '张三',
    customer_phone: '13800138001',
    address: '北京市朝阳区幸福小区1号楼101室',
    application_type: 'stop',
    reason: '用户申请暂停供气，因长期出差',
    planned_date: '2024-01-15',
    status: 'completed',
    applicant: '客服小李',
    applicant_role: 'customer_service',
    approved_by: '安检员王师傅',
    approved_at: '2024-01-10T10:00:00',
    executor: '维修师傅张工',
    executed_at: '2024-01-15T09:30:00',
    completed_at: '2024-01-15T10:00:00',
    created_at: '2024-01-08T09:00:00',
    updated_at: '2024-01-15T10:00:00'
  },
  {
    id: 'ga002',
    customer_id: 'c2',
    customer_name: '李四',
    customer_phone: '13800138002',
    address: '北京市朝阳区幸福小区1号楼102室',
    application_type: 'resume',
    reason: '用户申请恢复供气',
    planned_date: '2024-01-20',
    status: 'approved',
    applicant: '客服小李',
    applicant_role: 'customer_service',
    approved_by: '安检员王师傅',
    approved_at: '2024-01-18T14:00:00',
    created_at: '2024-01-16T11:00:00',
    updated_at: '2024-01-18T14:00:00'
  },
  {
    id: 'ga003',
    customer_id: 'c3',
    customer_name: '王五',
    customer_phone: '13800138003',
    address: '北京市朝阳区幸福小区2号楼201室',
    application_type: 'temporary_stop',
    reason: '装修施工需要临时停气',
    planned_date: '2024-01-25',
    status: 'pending',
    applicant: '安检员王师傅',
    applicant_role: 'safety_inspector',
    created_at: '2024-01-20T10:00:00',
    updated_at: '2024-01-20T10:00:00'
  },
  {
    id: 'ga004',
    customer_id: 'c4',
    customer_name: '赵六',
    customer_phone: '13800138004',
    address: '北京市朝阳区幸福小区2号楼202室',
    application_type: 'stop',
    reason: '发现燃气泄漏隐患，需停气检修',
    planned_date: '2024-01-22',
    status: 'executing',
    applicant: '安检员王师傅',
    applicant_role: 'safety_inspector',
    approved_by: '安检员王师傅',
    approved_at: '2024-01-21T09:00:00',
    executor: '维修师傅张工',
    executed_at: '2024-01-22T08:00:00',
    created_at: '2024-01-21T08:30:00',
    updated_at: '2024-01-22T08:00:00'
  },
  {
    id: 'ga005',
    customer_id: 'c5',
    customer_name: '孙七',
    customer_phone: '13800138005',
    address: '北京市朝阳区幸福小区3号楼301室',
    application_type: 'resume',
    reason: '装修完成，申请恢复供气',
    planned_date: '2024-01-28',
    status: 'pending',
    applicant: '客服小李',
    applicant_role: 'customer_service',
    created_at: '2024-01-23T15:00:00',
    updated_at: '2024-01-23T15:00:00'
  }
]

const customerVisits: CustomerVisit[] = [
  {
    id: 'cv001',
    application_id: 'ga001',
    customer_id: 'c1',
    customer_name: '张三',
    customer_phone: '13800138001',
    address: '北京市朝阳区幸福小区1号楼101室',
    visit_type: 'pre_visit',
    purpose: '停气前确认用户需求',
    status: 'completed',
    visitor: '客服小李',
    visitor_role: 'customer_service',
    scheduled_date: '2024-01-09',
    visited_at: '2024-01-09T10:00:00',
    contact_result: 'reached',
    feedback: '用户确认停气时间，无异议',
    created_at: '2024-01-08T11:00:00',
    updated_at: '2024-01-09T10:30:00'
  },
  {
    id: 'cv002',
    application_id: 'ga001',
    customer_id: 'c1',
    customer_name: '张三',
    customer_phone: '13800138001',
    address: '北京市朝阳区幸福小区1号楼101室',
    visit_type: 'post_visit',
    purpose: '停气后回访确认',
    status: 'completed',
    visitor: '客服小李',
    visitor_role: 'customer_service',
    scheduled_date: '2024-01-15',
    visited_at: '2024-01-15T14:00:00',
    contact_result: 'reached',
    feedback: '用户确认已停气，无问题',
    created_at: '2024-01-10T10:00:00',
    updated_at: '2024-01-15T14:30:00'
  },
  {
    id: 'cv003',
    application_id: 'ga002',
    customer_id: 'c2',
    customer_name: '李四',
    customer_phone: '13800138002',
    address: '北京市朝阳区幸福小区1号楼102室',
    visit_type: 'pre_visit',
    purpose: '复气前确认用户准备情况',
    status: 'pending',
    visitor: '客服小李',
    visitor_role: 'customer_service',
    scheduled_date: '2024-01-19',
    created_at: '2024-01-18T15:00:00',
    updated_at: '2024-01-18T15:00:00'
  },
  {
    id: 'cv004',
    customer_id: 'c4',
    customer_name: '赵六',
    customer_phone: '13800138004',
    address: '北京市朝阳区幸福小区2号楼202室',
    visit_type: 'follow_up',
    purpose: '隐患整改后回访',
    status: 'pending_verify',
    visitor: '安检员王师傅',
    visitor_role: 'safety_inspector',
    scheduled_date: '2024-01-23',
    visited_at: '2024-01-23T10:00:00',
    contact_result: 'reached',
    feedback: '用户反馈维修效果良好',
    created_at: '2024-01-22T16:00:00',
    updated_at: '2024-01-23T10:30:00'
  },
  {
    id: 'cv005',
    customer_id: 'c6',
    customer_name: '周八',
    customer_phone: '13800138006',
    address: '北京市朝阳区幸福小区3号楼302室',
    visit_type: 'follow_up',
    purpose: '换表后回访',
    status: 'failed',
    visitor: '客服小李',
    visitor_role: 'customer_service',
    scheduled_date: '2024-01-21',
    visited_at: '2024-01-21T11:00:00',
    contact_result: 'not_reached',
    feedback: '多次拨打无人接听',
    created_at: '2024-01-20T09:00:00',
    updated_at: '2024-01-21T11:30:00'
  }
]

const safetyChecks: SafetyCheck[] = [
  {
    id: 'sc001',
    customer_id: 'c1',
    customer_name: '张三',
    customer_phone: '13800138001',
    address: '北京市朝阳区幸福小区1号楼101室',
    inspector: '安检员王师傅',
    check_date: '2024-01-05',
    overall_result: 'passed',
    items: [
      { id: 'sci001', check_id: 'sc001', item_name: '燃气表状态', standard: '正常', actual: '正常', passed: true },
      { id: 'sci002', check_id: 'sc001', item_name: '管道接口', standard: '无泄漏', actual: '无泄漏', passed: true },
      { id: 'sci003', check_id: 'sc001', item_name: '报警器状态', standard: '正常', actual: '正常', passed: true },
    ],
    created_at: '2024-01-05T09:00:00',
    updated_at: '2024-01-05T10:00:00'
  },
  {
    id: 'sc002',
    customer_id: 'c4',
    customer_name: '赵六',
    customer_phone: '13800138004',
    address: '北京市朝阳区幸福小区2号楼202室',
    inspector: '安检员王师傅',
    check_date: '2024-01-20',
    overall_result: 'failed',
    items: [
      { id: 'sci004', check_id: 'sc002', item_name: '燃气表状态', standard: '正常', actual: '正常', passed: true },
      { id: 'sci005', check_id: 'sc002', item_name: '管道接口', standard: '无泄漏', actual: '发现轻微泄漏', passed: false },
      { id: 'sci006', check_id: 'sc002', item_name: '报警器状态', standard: '正常', actual: '正常', passed: true },
    ],
    remark: '发现管道接口泄漏，已申请停气检修',
    created_at: '2024-01-20T09:00:00',
    updated_at: '2024-01-20T10:30:00'
  },
  {
    id: 'sc003',
    customer_id: 'c5',
    customer_name: '孙七',
    customer_phone: '13800138005',
    address: '北京市朝阳区幸福小区3号楼301室',
    inspector: '安检员李师傅',
    check_date: '2024-01-22',
    overall_result: 'passed',
    items: [
      { id: 'sci007', check_id: 'sc003', item_name: '燃气表状态', standard: '正常', actual: '正常', passed: true },
      { id: 'sci008', check_id: 'sc003', item_name: '管道接口', standard: '无泄漏', actual: '无泄漏', passed: true },
      { id: 'sci009', check_id: 'sc003', item_name: '报警器状态', standard: '正常', actual: '正常', passed: true },
      { id: 'sci010', check_id: 'sc003', item_name: '软管老化情况', standard: '无老化', actual: '略有老化，建议更换', passed: true },
    ],
    remark: '软管略有老化，已提醒用户更换',
    created_at: '2024-01-22T14:00:00',
    updated_at: '2024-01-22T15:00:00'
  }
]

const hiddenDangers: HiddenDanger[] = [
  {
    id: 'hd001',
    check_id: 'sc002',
    customer_id: 'c4',
    customer_name: '赵六',
    customer_phone: '13800138004',
    address: '北京市朝阳区幸福小区2号楼202室',
    description: '厨房燃气管道接口处发现轻微泄漏',
    level: 'critical',
    status: 'completed',
    notified_at: '2024-01-20T11:00:00',
    rectified_at: '2024-01-22T12:00:00',
    rectified_by: '维修师傅张工',
    verify_result: 'passed',
    created_at: '2024-01-20T10:30:00',
    updated_at: '2024-01-22T14:00:00'
  },
  {
    id: 'hd002',
    customer_id: 'c6',
    customer_name: '周八',
    customer_phone: '13800138006',
    address: '北京市朝阳区幸福小区3号楼302室',
    description: '燃气表老化严重，读数不准确',
    level: 'major',
    status: 'in_progress',
    notified_at: '2024-01-18T10:00:00',
    rectified_by: '维修师傅张工',
    created_at: '2024-01-18T09:00:00',
    updated_at: '2024-01-20T16:00:00'
  },
  {
    id: 'hd003',
    customer_id: 'c3',
    customer_name: '王五',
    customer_phone: '13800138003',
    address: '北京市朝阳区幸福小区2号楼201室',
    description: '报警器电池电量不足',
    level: 'minor',
    status: 'pending',
    created_at: '2024-01-21T10:00:00',
    updated_at: '2024-01-21T10:00:00'
  }
]

const meterChanges: MeterChange[] = [
  {
    id: 'mc001',
    customer_id: 'c6',
    customer_name: '周八',
    customer_phone: '13800138006',
    address: '北京市朝阳区幸福小区3号楼302室',
    old_meter_number: 'M2020006',
    new_meter_number: 'M2024006',
    meter_type: '智能燃气表',
    change_date: '2024-01-20',
    technician: '维修师傅张工',
    reason: '旧表老化，读数不准确',
    status: 'completed',
    created_at: '2024-01-18T09:00:00',
    updated_at: '2024-01-20T15:00:00'
  },
  {
    id: 'mc002',
    customer_id: 'c2',
    customer_name: '李四',
    customer_phone: '13800138002',
    address: '北京市朝阳区幸福小区1号楼102室',
    old_meter_number: 'M2021002',
    new_meter_number: 'M2024007',
    meter_type: '智能燃气表',
    change_date: '2024-01-25',
    technician: '维修师傅李工',
    reason: '用户申请更换智能表',
    status: 'in_progress',
    created_at: '2024-01-22T10:00:00',
    updated_at: '2024-01-24T09:00:00'
  }
]

router.get('/customers', (req, res) => {
  res.json({ success: true, data: customers })
})

router.get('/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id)
  if (customer) {
    res.json({ success: true, data: customer })
  } else {
    res.json({ success: false, error: '客户不存在' })
  }
})

router.get('/applications', (req, res) => {
  let filtered = [...gasApplications]
  
  if (req.query.status) {
    filtered = filtered.filter(a => a.status === req.query.status)
  }
  if (req.query.applicant_role) {
    filtered = filtered.filter(a => a.applicant_role === req.query.applicant_role)
  }
  if (req.query.customer_name) {
    filtered = filtered.filter(a => a.customer_name.includes(req.query.customer_name as string))
  }
  
  res.json({ success: true, data: filtered })
})

router.get('/applications/:id', (req, res) => {
  const application = gasApplications.find(a => a.id === req.params.id)
  if (application) {
    const visits = customerVisits.filter(v => v.application_id === application.id)
    res.json({ success: true, data: { ...application, visits } })
  } else {
    res.json({ success: false, error: '申请不存在' })
  }
})

router.post('/applications', (req, res) => {
  const newApplication: GasApplication = {
    id: `ga${String(gasApplications.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending' as ApplicationStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  gasApplications.push(newApplication)
  res.json({ success: true, data: newApplication })
})

router.put('/applications/:id/approve', (req, res) => {
  const application = gasApplications.find(a => a.id === req.params.id)
  if (application) {
    application.status = 'approved'
    application.approved_by = req.body.approved_by
    application.approved_at = new Date().toISOString()
    application.updated_at = new Date().toISOString()
    res.json({ success: true, data: application })
  } else {
    res.json({ success: false, error: '申请不存在' })
  }
})

router.put('/applications/:id/execute', (req, res) => {
  const application = gasApplications.find(a => a.id === req.params.id)
  if (application) {
    application.status = 'executing'
    application.executor = req.body.executor
    application.executed_at = new Date().toISOString()
    application.updated_at = new Date().toISOString()
    res.json({ success: true, data: application })
  } else {
    res.json({ success: false, error: '申请不存在' })
  }
})

router.put('/applications/:id/complete', (req, res) => {
  const application = gasApplications.find(a => a.id === req.params.id)
  if (application) {
    application.status = 'completed'
    application.completed_at = new Date().toISOString()
    application.updated_at = new Date().toISOString()
    res.json({ success: true, data: application })
  } else {
    res.json({ success: false, error: '申请不存在' })
  }
})

router.put('/applications/:id/cancel', (req, res) => {
  const application = gasApplications.find(a => a.id === req.params.id)
  if (application) {
    application.status = 'cancelled'
    application.cancelled_by = req.body.cancelled_by
    application.cancelled_at = new Date().toISOString()
    application.updated_at = new Date().toISOString()
    res.json({ success: true, data: application })
  } else {
    res.json({ success: false, error: '申请不存在' })
  }
})

router.get('/visits', (req, res) => {
  let filtered = [...customerVisits]
  
  if (req.query.status) {
    filtered = filtered.filter(v => v.status === req.query.status)
  }
  if (req.query.visitor_role) {
    filtered = filtered.filter(v => v.visitor_role === req.query.visitor_role)
  }
  if (req.query.application_id) {
    filtered = filtered.filter(v => v.application_id === req.query.application_id)
  }
  if (req.query.customer_name) {
    filtered = filtered.filter(v => v.customer_name.includes(req.query.customer_name as string))
  }
  
  const result = filtered.map(v => {
    const app = gasApplications.find(a => a.id === v.application_id)
    return { ...v, application: app }
  })
  
  res.json({ success: true, data: result })
})

router.get('/visits/:id', (req, res) => {
  const visit = customerVisits.find(v => v.id === req.params.id)
  if (visit) {
    const app = gasApplications.find(a => a.id === visit.application_id)
    res.json({ success: true, data: { ...visit, application: app } })
  } else {
    res.json({ success: false, error: '回访记录不存在' })
  }
})

router.post('/visits', (req, res) => {
  const newVisit: CustomerVisit = {
    id: `cv${String(customerVisits.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending' as VisitStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  customerVisits.push(newVisit)
  res.json({ success: true, data: newVisit })
})

router.put('/visits/:id/complete', (req, res) => {
  const visit = customerVisits.find(v => v.id === req.params.id)
  if (visit) {
    visit.status = 'completed'
    visit.visited_at = new Date().toISOString()
    visit.contact_result = req.body.contact_result
    visit.feedback = req.body.feedback
    visit.updated_at = new Date().toISOString()
    res.json({ success: true, data: visit })
  } else {
    res.json({ success: false, error: '回访记录不存在' })
  }
})

router.put('/visits/:id/verify', (req, res) => {
  const visit = customerVisits.find(v => v.id === req.params.id)
  if (visit) {
    visit.status = req.body.passed ? 'completed' : 'failed'
    visit.updated_at = new Date().toISOString()
    res.json({ success: true, data: visit })
  } else {
    res.json({ success: false, error: '回访记录不存在' })
  }
})

router.get('/safety-checks', (req, res) => {
  let filtered = [...safetyChecks]
  
  if (req.query.inspector) {
    filtered = filtered.filter(c => c.inspector === req.query.inspector)
  }
  if (req.query.customer_name) {
    filtered = filtered.filter(c => c.customer_name.includes(req.query.customer_name as string))
  }
  
  res.json({ success: true, data: filtered })
})

router.get('/safety-checks/:id', (req, res) => {
  const check = safetyChecks.find(c => c.id === req.params.id)
  if (check) {
    const dangers = hiddenDangers.filter(d => d.check_id === check.id)
    res.json({ success: true, data: { ...check, hiddenDangers: dangers } })
  } else {
    res.json({ success: false, error: '安检记录不存在' })
  }
})

router.post('/safety-checks', (req, res) => {
  const newCheck: SafetyCheck = {
    id: `sc${String(safetyChecks.length + 1).padStart(3, '0')}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  safetyChecks.push(newCheck)
  res.json({ success: true, data: newCheck })
})

router.get('/hidden-dangers', (req, res) => {
  let filtered = [...hiddenDangers]
  
  if (req.query.level) {
    filtered = filtered.filter(d => d.level === req.query.level)
  }
  if (req.query.status) {
    filtered = filtered.filter(d => d.status === req.query.status)
  }
  if (req.query.customer_name) {
    filtered = filtered.filter(d => d.customer_name.includes(req.query.customer_name as string))
  }
  
  res.json({ success: true, data: filtered })
})

router.get('/hidden-dangers/:id', (req, res) => {
  const danger = hiddenDangers.find(d => d.id === req.params.id)
  if (danger) {
    const check = safetyChecks.find(c => c.id === danger.check_id)
    res.json({ success: true, data: { ...danger, check } })
  } else {
    res.json({ success: false, error: '隐患记录不存在' })
  }
})

router.post('/hidden-dangers', (req, res) => {
  const newDanger: HiddenDanger = {
    id: `hd${String(hiddenDangers.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending' as RecordStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  hiddenDangers.push(newDanger)
  res.json({ success: true, data: newDanger })
})

router.put('/hidden-dangers/:id/notify', (req, res) => {
  const danger = hiddenDangers.find(d => d.id === req.params.id)
  if (danger) {
    danger.status = 'in_progress'
    danger.notified_at = new Date().toISOString()
    danger.updated_at = new Date().toISOString()
    res.json({ success: true, data: danger })
  } else {
    res.json({ success: false, error: '隐患记录不存在' })
  }
})

router.put('/hidden-dangers/:id/rectify', (req, res) => {
  const danger = hiddenDangers.find(d => d.id === req.params.id)
  if (danger) {
    danger.status = 'completed'
    danger.rectified_at = new Date().toISOString()
    danger.rectified_by = req.body.rectified_by
    danger.verify_result = req.body.verify_result
    danger.updated_at = new Date().toISOString()
    res.json({ success: true, data: danger })
  } else {
    res.json({ success: false, error: '隐患记录不存在' })
  }
})

router.get('/meter-changes', (req, res) => {
  let filtered = [...meterChanges]
  
  if (req.query.technician) {
    filtered = filtered.filter(m => m.technician === req.query.technician)
  }
  if (req.query.customer_name) {
    filtered = filtered.filter(m => m.customer_name.includes(req.query.customer_name as string))
  }
  
  res.json({ success: true, data: filtered })
})

router.get('/meter-changes/:id', (req, res) => {
  const change = meterChanges.find(m => m.id === req.params.id)
  if (change) {
    res.json({ success: true, data: change })
  } else {
    res.json({ success: false, error: '换表记录不存在' })
  }
})

router.post('/meter-changes', (req, res) => {
  const newChange: MeterChange = {
    id: `mc${String(meterChanges.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending' as RecordStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  meterChanges.push(newChange)
  res.json({ success: true, data: newChange })
})

router.put('/meter-changes/:id/complete', (req, res) => {
  const change = meterChanges.find(m => m.id === req.params.id)
  if (change) {
    change.status = 'completed'
    change.updated_at = new Date().toISOString()
    res.json({ success: true, data: change })
  } else {
    res.json({ success: false, error: '换表记录不存在' })
  }
})

export default router