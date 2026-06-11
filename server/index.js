import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const users = {
  inspector: { id: 'u_inspector_01', name: '王工', role: 'inspector', roleName: '巡检工程师' },
  property:  { id: 'u_property_01',  name: '李经理', role: 'property',  roleName: '物业联系人' },
  supervisor:{ id: 'u_supervisor_01',name: '张主管', role: 'supervisor',roleName: '维保主管' }
}

function now(offsetHours = 0) {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

let records = [
  {
    id: 'R20260610001',
    title: 'A栋3层消防栓玻璃破损',
    location: 'A栋 3F 东侧走廊',
    riskLevel: 'high',
    status: 'pending_dispatch',
    inspector: 'u_inspector_01',
    property: null,
    supervisor: null,
    discovery: '巡检发现，玻璃有明显裂纹，影响紧急使用。',
    discoveryAttachments: ['现场照片-01.jpg', '旧台账截图.png'],
    dispatchNote: '',
    dispatchAt: null,
    rectificationNote: '',
    rectificationAt: null,
    rectificationAttachments: [],
    reInspectionResult: '',
    reInspectionAt: null,
    reInspectionAttachments: [],
    rejectReason: '',
    rejectAt: null,
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-48),
    updatedAt: now(-48),
    timeline: [
      { time: now(-48), actor: '王工', action: '创建整改记录', detail: '巡检发现消防栓玻璃破损' }
    ]
  },
  {
    id: 'R20260610002',
    title: 'B栋地下车库烟感探测器离线',
    location: 'B栋 B2 车库 C区',
    riskLevel: 'high',
    status: 'dispatched',
    inspector: 'u_inspector_01',
    property: 'u_property_01',
    supervisor: 'u_supervisor_01',
    discovery: '主机报离线，连续48小时无信号，需更换设备。',
    discoveryAttachments: ['烟感离线报警截图.png'],
    dispatchNote: '请尽快联系厂家更换，工期不超过3天。',
    dispatchAt: now(-20),
    rectificationNote: '',
    rectificationAt: null,
    rectificationAttachments: [],
    reInspectionResult: '',
    reInspectionAt: null,
    reInspectionAttachments: [],
    rejectReason: '',
    rejectAt: null,
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-36),
    updatedAt: now(-20),
    timeline: [
      { time: now(-36), actor: '王工', action: '创建整改记录', detail: 'B栋B2烟感离线' },
      { time: now(-20), actor: '张主管', action: '派发整改', detail: '派发至李经理，要求3天内完成' }
    ]
  },
  {
    id: 'R20260610003',
    title: 'C栋1层应急照明照度不足',
    location: 'C栋 1F 大堂',
    riskLevel: 'medium',
    status: 'rectified',
    inspector: 'u_inspector_01',
    property: 'u_property_01',
    supervisor: 'u_supervisor_01',
    discovery: '照度仪显示仅1.2lux，低于规范要求的5lux。',
    discoveryAttachments: ['照度检测报告.pdf'],
    dispatchNote: '请更换蓄电池或调整灯具角度。',
    dispatchAt: now(-60),
    rectificationNote: '已全部更换为LED应急灯，实测照度8.5lux。',
    rectificationAt: now(-10),
    rectificationAttachments: ['新灯具安装照片.jpg', '复测照度截图.png'],
    reInspectionResult: '',
    reInspectionAt: null,
    reInspectionAttachments: [],
    rejectReason: '',
    rejectAt: null,
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-72),
    updatedAt: now(-10),
    timeline: [
      { time: now(-72), actor: '王工', action: '创建整改记录', detail: '应急照明照度不足' },
      { time: now(-60), actor: '张主管', action: '派发整改', detail: '派发至李经理' },
      { time: now(-10), actor: '李经理', action: '提交整改完成', detail: '更换LED应急灯，实测8.5lux' }
    ]
  },
  {
    id: 'R20260610004',
    title: 'D栋防火门闭门器损坏',
    location: 'D栋 5F 楼梯间',
    riskLevel: 'medium',
    status: 'rejected',
    inspector: 'u_inspector_01',
    property: 'u_property_01',
    supervisor: 'u_supervisor_01',
    discovery: '闭门器漏油，无法自动闭合。',
    discoveryAttachments: ['闭门器漏油照片.jpg'],
    dispatchNote: '请更换同型号闭门器。',
    dispatchAt: now(-96),
    rectificationNote: '已更换闭门器。',
    rectificationAt: now(-48),
    rectificationAttachments: ['更换后照片.jpg'],
    reInspectionResult: '',
    reInspectionAt: null,
    reInspectionAttachments: [],
    rejectReason: '闭门后仍有2cm缝隙，未完全闭合；且未提供合格证。',
    rejectAt: now(-24),
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-120),
    updatedAt: now(-24),
    timeline: [
      { time: now(-120), actor: '王工', action: '创建整改记录', detail: '闭门器损坏' },
      { time: now(-96),  actor: '张主管', action: '派发整改', detail: '派发至李经理' },
      { time: now(-48),  actor: '李经理', action: '提交整改完成', detail: '更换闭门器' },
      { time: now(-24),  actor: '王工', action: '复检驳回', detail: '仍有2cm缝隙，缺少合格证' }
    ]
  },
  {
    id: 'R20260610005',
    title: 'E栋消防通道杂物堆积',
    location: 'E栋 2F 疏散通道',
    riskLevel: 'low',
    status: 'passed',
    inspector: 'u_inspector_01',
    property: 'u_property_01',
    supervisor: 'u_supervisor_01',
    discovery: '通道堆放纸箱、旧家具，影响疏散。',
    discoveryAttachments: ['通道堆积照片.jpg'],
    dispatchNote: '24小时内清理完毕。',
    dispatchAt: now(-168),
    rectificationNote: '已全部清理，通道畅通。',
    rectificationAt: now(-160),
    rectificationAttachments: ['清理后照片.jpg'],
    reInspectionResult: '通道已畅通，无杂物堆积，复检通过。',
    reInspectionAt: now(-150),
    reInspectionAttachments: ['复检现场照片.jpg'],
    rejectReason: '',
    rejectAt: null,
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-170),
    updatedAt: now(-150),
    timeline: [
      { time: now(-170), actor: '王工', action: '创建整改记录', detail: '通道堆积杂物' },
      { time: now(-168), actor: '张主管', action: '派发整改', detail: '派发至李经理' },
      { time: now(-160), actor: '李经理', action: '提交整改完成', detail: '清理完毕' },
      { time: now(-150), actor: '王工', action: '复检通过', detail: '通道畅通' }
    ]
  },
  {
    id: 'R20260610006',
    title: 'A栋消防泵压力异常',
    location: 'A栋 地下泵房',
    riskLevel: 'high',
    status: 'pending_dispatch',
    inspector: 'u_inspector_01',
    property: null,
    supervisor: null,
    discovery: '静压仅0.2MPa，低于要求的0.6MPa，可能存在泄漏。',
    discoveryAttachments: ['压力表照片.jpg'],
    dispatchNote: '',
    dispatchAt: null,
    rectificationNote: '',
    rectificationAt: null,
    rectificationAttachments: [],
    reInspectionResult: '',
    reInspectionAt: null,
    reInspectionAttachments: [],
    rejectReason: '',
    rejectAt: null,
    supplementaryNote: '',
    supplementaryAt: null,
    createdAt: now(-6),
    updatedAt: now(-6),
    timeline: [
      { time: now(-6), actor: '王工', action: '创建整改记录', detail: '消防泵压力异常' }
    ]
  }
]

function pushTimeline(rec, actorName, action, detail) {
  rec.timeline.push({ time: now(), actor: actorName, action, detail })
  rec.updatedAt = now()
}

app.get('/api/users', (req, res) => {
  res.json({ users: Object.values(users) })
})

app.get('/api/records', (req, res) => {
  const { status, riskLevel, role } = req.query
  let list = [...records]
  if (status) list = list.filter(r => r.status === status)
  if (riskLevel) list = list.filter(r => r.riskLevel === riskLevel)
  if (role === 'inspector') {
    list = list.filter(r => r.inspector === 'u_inspector_01' || r.status === 'rectified')
  } else if (role === 'property') {
    list = list.filter(r => r.property === 'u_property_01' && (r.status === 'dispatched' || r.status === 'rejected'))
  }
  res.json({ records: list })
})

app.get('/api/records/stats', (req, res) => {
  const role = req.query.role || 'supervisor'
  let todos = [], risks = { high: 0, medium: 0, low: 0 }, recent = []

  const scoped = records.filter(r => {
    if (role === 'inspector') return r.inspector === 'u_inspector_01' || r.status === 'rectified'
    if (role === 'property')  return r.property === 'u_property_01' && (r.status === 'dispatched' || r.status === 'rejected')
    return true
  })

  scoped.forEach(r => {
    if (r.riskLevel === 'high') risks.high++
    if (r.riskLevel === 'medium') risks.medium++
    if (r.riskLevel === 'low') risks.low++

    let isTodo = false, todoLabel = ''
    if (role === 'inspector') {
      if (r.status === 'rectified') { isTodo = true; todoLabel = '待复检' }
      else if (r.status === 'pending_dispatch') { isTodo = true; todoLabel = '待派发(新建)' }
    } else if (role === 'property') {
      if (r.status === 'dispatched') { isTodo = true; todoLabel = '待整改' }
      else if (r.status === 'rejected') { isTodo = true; todoLabel = '待补录(被驳回)' }
    } else if (role === 'supervisor') {
      if (r.status === 'pending_dispatch') { isTodo = true; todoLabel = '待派发' }
    }
    if (isTodo) todos.push({ ...r, todoLabel })
  })

  recent = [...scoped].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8)

  res.json({ todos, risks, recent })
})

app.get('/api/records/:id', (req, res) => {
  const r = records.find(x => x.id === req.params.id)
  if (!r) return res.status(404).json({ error: '不存在' })
  res.json({ record: r })
})

app.post('/api/records/:id/dispatch', (req, res) => {
  const r = records.find(x => x.id === req.params.id)
  if (!r) return res.status(404).json({ error: '不存在' })
  const { propertyId, supervisorId, note } = req.body
  r.property = propertyId || 'u_property_01'
  r.supervisor = supervisorId || 'u_supervisor_01'
  r.dispatchNote = note || ''
  r.dispatchAt = now()
  r.status = 'dispatched'
  pushTimeline(r, '张主管', '派发整改', note || '派发至物业联系人')
  res.json({ record: r })
})

app.post('/api/records/:id/rectify', (req, res) => {
  const r = records.find(x => x.id === req.params.id)
  if (!r) return res.status(404).json({ error: '不存在' })
  const { note, attachments } = req.body
  r.rectificationNote = note || ''
  r.rectificationAttachments = attachments || []
  r.rectificationAt = now()
  r.status = 'rectified'
  if (r.rejectReason) {
    r.supplementaryNote = note || ''
    r.supplementaryAt = now()
    r.reInspectionResult = ''
    r.reInspectionAt = null
    r.reInspectionAttachments = []
    pushTimeline(r, '李经理', '补录并重新提交', note || '补充整改说明')
  } else {
    pushTimeline(r, '李经理', '提交整改完成', note || '整改完成')
  }
  res.json({ record: r })
})

app.post('/api/records/:id/reinspect', (req, res) => {
  const r = records.find(x => x.id === req.params.id)
  if (!r) return res.status(404).json({ error: '不存在' })
  const { passed, result, attachments, rejectReason } = req.body
  r.reInspectionResult = result || ''
  r.reInspectionAttachments = attachments || []
  r.reInspectionAt = now()
  if (passed) {
    r.status = 'passed'
    r.rejectReason = ''
    r.rejectAt = null
    r.supplementaryNote = ''
    r.supplementaryAt = null
    pushTimeline(r, '王工', '复检通过', result || '整改合格')
  } else {
    r.status = 'rejected'
    r.rejectReason = rejectReason || ''
    r.rejectAt = now()
    pushTimeline(r, '王工', '复检驳回', rejectReason || '需重新整改')
  }
  res.json({ record: r })
})

app.post('/api/records/batch-dispatch', (req, res) => {
  const { ids, propertyId, supervisorId, note } = req.body
  ids.forEach(id => {
    const r = records.find(x => x.id === id)
    if (r && r.status === 'pending_dispatch') {
      r.property = propertyId || 'u_property_01'
      r.supervisor = supervisorId || 'u_supervisor_01'
      r.dispatchNote = note || ''
      r.dispatchAt = now()
      r.status = 'dispatched'
      pushTimeline(r, '张主管', '批量派发整改', note || '批量派发')
    }
  })
  res.json({ ok: true, count: ids.length })
})

app.post('/api/records/batch-reinspect', (req, res) => {
  const { ids, passed, result } = req.body
  let count = 0
  ids.forEach(id => {
    const r = records.find(x => x.id === id)
    if (r && r.status === 'rectified') {
      r.reInspectionResult = result || ''
      r.reInspectionAt = now()
      if (passed) {
        r.status = 'passed'
        r.rejectReason = ''
        r.rejectAt = null
        r.supplementaryNote = ''
        r.supplementaryAt = null
        pushTimeline(r, '王工', '批量复检通过', result || '批量通过')
      }
      count++
    }
  })
  res.json({ ok: true, count })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Fire maintenance API running on http://localhost:${PORT}`)
})
