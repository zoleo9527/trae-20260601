import cors from 'cors'
import express from 'express'

const app = express()
app.use(cors())
app.use(express.json())

let acceptances = []
let reviews = []
let auditLogs = []
let nextAcceptId = 1
let nextReviewId = 1
let nextLogId = 1

function addLog(acceptanceId, action, operator, role, detail) {
  auditLogs.push({
    id: nextLogId++,
    acceptanceId,
    action,
    operator,
    role,
    detail,
    timestamp: new Date().toISOString()
  })
}

function generateSeedData() {
  const seedAcceptances = [
    {
      shipperName: '顺达物流有限公司',
      shipperContact: '王建国 13800138001',
      shipperDocs: ['营业执照复印件', '道路运输经营许可证'],
      items: [
        { name: '钢材（螺纹钢）', category: '普通货物', weight: 52.5, unit: '吨', packaging: '散装' }
      ],
      destinationStation: '郑州北站',
      originStation: '石家庄南站',
      status: 'accepted',
      remark: '',
      createdAt: '2026-06-07T08:30:00Z'
    },
    {
      shipperName: '鑫达化工贸易有限公司',
      shipperContact: '李明华 13900139002',
      shipperDocs: ['营业执照复印件'],
      items: [
        { name: '硫酸', category: '危险品-第8类腐蚀品', weight: 30.2, unit: '吨', packaging: '专用罐车' }
      ],
      destinationStation: '武汉北站',
      originStation: '石家庄南站',
      status: 'rejected',
      remark: '危险品缺少《危险货物托运人资质证书》及《包装检验合格证》',
      createdAt: '2026-06-07T09:15:00Z'
    },
    {
      shipperName: '中原建材集团',
      shipperContact: '张伟 13700137003',
      shipperDocs: ['营业执照复印件', '产品质量检验报告'],
      items: [
        { name: '水泥（P.O42.5）', category: '普通货物', weight: 65.0, unit: '吨', packaging: '袋装' }
      ],
      destinationStation: '西安西站',
      originStation: '石家庄南站',
      status: 'reviewing',
      remark: '',
      createdAt: '2026-06-07T10:00:00Z'
    },
    {
      shipperName: '华北粮油贸易公司',
      shipperContact: '赵德才 13600136004',
      shipperDocs: ['营业执照复印件', '食品经营许可证', '产品合格证'],
      items: [
        { name: '大豆油', category: '普通货物', weight: 25.0, unit: '吨', packaging: '桶装' },
        { name: '面粉', category: '普通货物', weight: 18.5, unit: '吨', packaging: '袋装' }
      ],
      destinationStation: '太原北站',
      originStation: '石家庄南站',
      status: 'approved',
      remark: '',
      createdAt: '2026-06-07T11:20:00Z'
    },
    {
      shipperName: '恒通矿业有限公司',
      shipperContact: '刘振东 13500135005',
      shipperDocs: ['营业执照复印件', '矿产品检测报告'],
      items: [
        { name: '铁矿石', category: '普通货物', weight: 120.0, unit: '吨', packaging: '散装' }
      ],
      destinationStation: '唐山南站',
      originStation: '石家庄南站',
      status: 'supplementing',
      remark: '过磅重量与申报重量不一致（申报120吨，过磅112.3吨），需补充《过磅单》',
      createdAt: '2026-06-07T13:45:00Z'
    },
    {
      shipperName: '冀南农资供应站',
      shipperContact: '孙继红 13400134006',
      shipperDocs: ['营业执照复印件'],
      items: [
        { name: '复合肥', category: '普通货物', weight: 40.0, unit: '吨', packaging: '袋装' }
      ],
      destinationStation: '邯郸站',
      originStation: '石家庄南站',
      status: 'accepted',
      remark: '',
      createdAt: '2026-06-07T14:30:00Z'
    },
    {
      shipperName: '华东机电设备有限公司',
      shipperContact: '陈立军 13300133007',
      shipperDocs: ['营业执照复印件', '产品装箱单', '技术参数证明'],
      items: [
        { name: '数控机床', category: '普通货物', weight: 8.5, unit: '吨', packaging: '木箱' }
      ],
      destinationStation: '南京西站',
      originStation: '石家庄南站',
      status: 'reviewing',
      remark: '',
      createdAt: '2026-06-07T15:10:00Z'
    },
    {
      shipperName: '远东化工进出口公司',
      shipperContact: '周国安 13200132008',
      shipperDocs: ['营业执照复印件', '进出口许可证'],
      items: [
        { name: '丙酮', category: '危险品-第3类易燃液体', weight: 22.0, unit: '吨', packaging: '专用罐车' }
      ],
      destinationStation: '青岛站',
      originStation: '石家庄南站',
      status: 'rejected',
      remark: '危险品缺少《危险货物托运人资质证书》及安全技术说明书(MSDS)',
      createdAt: '2026-06-07T16:00:00Z'
    },
    {
      shipperName: '冀中煤炭运销公司',
      shipperContact: '马志强 13100131009',
      shipperDocs: ['营业执照复印件', '煤炭经营资格证'],
      items: [
        { name: '动力煤', category: '普通货物', weight: 3000.0, unit: '吨', packaging: '散装' }
      ],
      destinationStation: '济南站',
      originStation: '石家庄南站',
      status: 'accepted',
      remark: '',
      createdAt: '2026-06-08T07:30:00Z'
    },
    {
      shipperName: '天宇汽车零部件公司',
      shipperContact: '黄晓峰 13000130010',
      shipperDocs: ['营业执照复印件', '产品合格证'],
      items: [
        { name: '汽车发动机总成', category: '普通货物', weight: 2.8, unit: '吨', packaging: '木箱' },
        { name: '变速箱', category: '普通货物', weight: 1.2, unit: '吨', packaging: '木箱' }
      ],
      destinationStation: '长春站',
      originStation: '石家庄南站',
      status: 'supplementing',
      remark: '到站信息变更：原申报"长春南站"在路网中不存在，需确认正确到站名称',
      createdAt: '2026-06-08T08:45:00Z'
    },
    {
      shipperName: '盛达塑料制品厂',
      shipperContact: '吴丽萍 12900129011',
      shipperDocs: ['营业执照复印件', '产品检测报告'],
      items: [
        { name: 'PVC管材', category: '普通货物', weight: 15.0, unit: '吨', packaging: '捆装' }
      ],
      destinationStation: '兰州西站',
      originStation: '石家庄南站',
      status: 'approved',
      remark: '',
      createdAt: '2026-06-08T09:30:00Z'
    },
    {
      shipperName: '信通电子科技公司',
      shipperContact: '杨志刚 12800128012',
      shipperDocs: ['营业执照复印件'],
      items: [
        { name: '通信设备', category: '普通货物', weight: 3.5, unit: '吨', packaging: '纸箱' }
      ],
      destinationStation: '成都东站',
      originStation: '石家庄南站',
      status: 'reviewing',
      remark: '',
      createdAt: '2026-06-08T10:15:00Z'
    }
  ]

  seedAcceptances.forEach(s => {
    const id = nextAcceptId++
    const acceptance = { id, ...s }
    acceptances.push(acceptance)

    if (s.status === 'rejected' || s.status === 'supplementing' || s.status === 'approved') {
      const reviewId = nextReviewId++
      reviews.push({
        id: reviewId,
        acceptanceId: id,
        reviewer: s.status === 'rejected' ? '王审核' : '张审核',
        result: s.status === 'approved' ? 'approved' : 'rejected',
        opinion: s.remark || '通过',
        reviewedAt: new Date(new Date(s.createdAt).getTime() + 3600000).toISOString(),
        relatedItem: s.items.map(i => i.name).join('、'),
        relatedDoc: s.status === 'rejected'
          ? s.shipperDocs.filter(d => !d.includes('资质') && !d.includes('合格证') && !d.includes('MSDS')).join('、') || '（缺失）'
          : s.shipperDocs.join('、')
      })
    }
  })

  const seedLogs = [
    { acceptanceId: 1, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：顺达物流-钢材，52.5吨→郑州北站' },
    { acceptanceId: 1, action: 'review_approve', operator: '张审核', role: '复核员', detail: '票据复核通过' },
    { acceptanceId: 2, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：鑫达化工-硫酸，30.2吨→武汉北站' },
    { acceptanceId: 2, action: 'review_reject', operator: '王审核', role: '复核员', detail: '复核退回：危险品缺少《危险货物托运人资质证书》及《包装检验合格证》' },
    { acceptanceId: 3, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：中原建材-水泥，65.0吨→西安西站' },
    { acceptanceId: 3, action: 'review_start', operator: '张审核', role: '复核员', detail: '开始复核' },
    { acceptanceId: 4, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：华北粮油-大豆油+面粉，43.5吨→太原北站' },
    { acceptanceId: 4, action: 'review_approve', operator: '张审核', role: '复核员', detail: '票据复核通过' },
    { acceptanceId: 5, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：恒通矿业-铁矿石，120.0吨→唐山南站' },
    { acceptanceId: 5, action: 'review_reject', operator: '王审核', role: '复核员', detail: '复核退回：过磅重量112.3吨与申报重量120吨不一致，需补充过磅单' },
    { acceptanceId: 5, action: 'supplement', operator: '刘振东', role: '货主', detail: '补资料：已上传过磅单（实重112.3吨），申请重新复核' },
    { acceptanceId: 6, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：冀南农资-复合肥，40.0吨→邯郸站' },
    { acceptanceId: 7, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：华东机电-数控机床，8.5吨→南京西站' },
    { acceptanceId: 7, action: 'review_start', operator: '王审核', role: '复核员', detail: '开始复核' },
    { acceptanceId: 8, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：远东化工-丙酮，22.0吨→青岛站' },
    { acceptanceId: 8, action: 'review_reject', operator: '张审核', role: '复核员', detail: '复核退回：危险品缺少《危险货物托运人资质证书》及安全技术说明书(MSDS)' },
    { acceptanceId: 9, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：冀中煤炭-动力煤，3000.0吨→济南站' },
    { acceptanceId: 10, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：天宇汽配-发动机+变速箱，4.0吨→长春站' },
    { acceptanceId: 10, action: 'review_reject', operator: '王审核', role: '复核员', detail: '复核退回：到站"长春南站"在路网中不存在，需确认正确到站名称' },
    { acceptanceId: 10, action: 'supplement', operator: '黄晓峰', role: '货主', detail: '补资料：确认到站为"长春站"，已修改到站信息' },
    { acceptanceId: 11, action: 'create', operator: '赵货运', role: '货运员', detail: '录入托运单：盛达塑料-PVC管材，15.0吨→兰州西站' },
    { acceptanceId: 11, action: 'review_approve', operator: '张审核', role: '复核员', detail: '票据复核通过' },
    { acceptanceId: 12, action: 'create', operator: '钱货运', role: '货运员', detail: '录入托运单：信通电子-通信设备，3.5吨→成都东站' },
    { acceptanceId: 12, action: 'review_start', operator: '王审核', role: '复核员', detail: '开始复核' }
  ]

  seedLogs.forEach(l => {
    auditLogs.push({
      id: nextLogId++,
      ...l,
      timestamp: new Date(Date.now() - (seedLogs.length - seedLogs.indexOf(l)) * 600000).toISOString()
    })
  })

  console.log(`种子数据已生成: ${acceptances.length}条受理记录, ${reviews.length}条复核记录, ${auditLogs.length}条操作日志`)
}

app.get('/api/acceptances', (req, res) => {
  const { status, keyword, role } = req.query
  let result = [...acceptances]

  if (status && status !== 'all') {
    result = result.filter(a => a.status === status)
  }
  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(a =>
      a.shipperName.toLowerCase().includes(kw) ||
      a.destinationStation.toLowerCase().includes(kw) ||
      a.items.some(i => i.name.toLowerCase().includes(kw))
    )
  }
  if (role === 'loading_supervisor') {
    result = result.filter(a => ['accepted', 'reviewing', 'supplementing', 'approved'].includes(a.status))
  }

  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  result = result.map(a => ({
    ...a,
    reviewHistory: reviews.filter(r => r.acceptanceId === a.id)
  }))
  res.json(result)
})

app.get('/api/acceptances/:id', (req, res) => {
  const a = acceptances.find(a => a.id === parseInt(req.params.id))
  if (!a) return res.status(404).json({ error: '未找到该受理记录' })
  res.json(a)
})

app.post('/api/acceptances', (req, res) => {
  const { shipperName, shipperContact, shipperDocs, items, destinationStation, remark } = req.body
  if (!shipperName || !items?.length || !destinationStation) {
    return res.status(400).json({ error: '货主名称、货品信息和到站为必填项' })
  }
  const acceptance = {
    id: nextAcceptId++,
    shipperName,
    shipperContact: shipperContact || '',
    shipperDocs: shipperDocs || [],
    items,
    destinationStation,
    originStation: '石家庄南站',
    status: 'accepted',
    remark: remark || '',
    createdAt: new Date().toISOString()
  }
  acceptances.push(acceptance)
  addLog(acceptance.id, 'create', '赵货运', '货运员', `录入托运单：${shipperName}-${items.map(i => i.name).join('+')}，${items.reduce((s, i) => s + i.weight, 0)}吨→${destinationStation}`)
  res.status(201).json(acceptance)
})

app.put('/api/acceptances/:id/supplement', (req, res) => {
  const a = acceptances.find(a => a.id === parseInt(req.params.id))
  if (!a) return res.status(404).json({ error: '未找到该受理记录' })
  if (a.status !== 'rejected' && a.status !== 'supplementing') {
    return res.status(400).json({ error: '当前状态不允许补资料，仅退回或补资料中状态可操作' })
  }
  const { shipperDocs, remark, destinationStation, items } = req.body
  if (shipperDocs) a.shipperDocs = [...a.shipperDocs, ...shipperDocs]
  if (remark) a.remark = remark
  if (destinationStation) a.destinationStation = destinationStation
  if (items) a.items = items
  a.status = 'supplementing'
  addLog(a.id, 'supplement', req.body.operator || '货主', '货主', `补资料：${remark || '已补充材料，申请重新复核'}`)
  res.json(a)
})

app.get('/api/reviews', (req, res) => {
  const { acceptanceId } = req.query
  let result = [...reviews]
  if (acceptanceId) {
    result = result.filter(r => r.acceptanceId === parseInt(acceptanceId))
  }
  res.json(result)
})

app.post('/api/reviews', (req, res) => {
  const { acceptanceId, result, opinion, reviewer } = req.body
  const a = acceptances.find(a => a.id === acceptanceId)
  if (!a) return res.status(404).json({ error: '未找到该受理记录' })
  if (!['approved', 'rejected'].includes(result)) {
    return res.status(400).json({ error: '复核结果必须为 approved 或 rejected' })
  }

  const review = {
    id: nextReviewId++,
    acceptanceId,
    reviewer: reviewer || '张审核',
    result,
    opinion: opinion || (result === 'approved' ? '通过' : '退回'),
    reviewedAt: new Date().toISOString(),
    relatedItem: a.items.map(i => i.name).join('、'),
    relatedDoc: a.shipperDocs.join('、')
  }
  reviews.push(review)

  a.status = result
  if (result === 'rejected' && opinion) {
    a.remark = opinion
  }

  addLog(a.id, result === 'approved' ? 'review_approve' : 'review_reject',
    reviewer || '张审核', '复核员',
    result === 'approved' ? '票据复核通过' : `复核退回：${opinion || '资料不合规'}`)

  res.status(201).json(review)
})

app.put('/api/acceptances/:id/return', (req, res) => {
  const a = acceptances.find(a => a.id === parseInt(req.params.id))
  if (!a) return res.status(404).json({ error: '未找到该受理记录' })
  if (!['reviewing', 'supplementing'].includes(a.status)) {
    return res.status(400).json({ error: '当前状态不允许退回' })
  }
  const { reason, operator } = req.body
  a.status = 'rejected'
  a.remark = reason || a.remark
  addLog(a.id, 'return', operator || '系统', '复核员', `退回至货主：${reason || a.remark}`)
  res.json(a)
})

app.get('/api/audit-logs', (req, res) => {
  const { acceptanceId } = req.query
  let result = [...auditLogs]
  if (acceptanceId) {
    result = result.filter(l => l.acceptanceId === parseInt(acceptanceId))
  }
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  res.json(result)
})

app.get('/api/acceptances/:id/trace', (req, res) => {
  const a = acceptances.find(a => a.id === parseInt(req.params.id))
  if (!a) return res.status(404).json({ error: '未找到该受理记录' })

  const relatedReviews = reviews.filter(r => r.acceptanceId === a.id)
  const relatedLogs = auditLogs.filter(l => l.acceptanceId === a.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const traceItems = relatedLogs.map(log => {
    let traceFrom = null
    let traceTo = null

    if (log.action === 'review_reject') {
      traceFrom = {
        type: '复核环节',
        detail: relatedReviews.find(r => r.result === 'rejected')?.opinion || log.detail
      }
      traceTo = {
        type: '原始托运资料',
        detail: `货主: ${a.shipperName}, 货品: ${a.items.map(i => i.name).join('、')}, 到站: ${a.destinationStation}, 已提交资料: ${a.shipperDocs.join('、') || '（无）'}`
      }
    } else if (log.action === 'supplement') {
      traceFrom = {
        type: '补资料环节',
        detail: log.detail
      }
      traceTo = {
        type: '原始托运资料',
        detail: `货主: ${a.shipperName}, 补充后资料: ${a.shipperDocs.join('、')}`
      }
    }

    return {
      ...log,
      traceFrom,
      traceTo
    }
  })

  res.json({
    acceptance: a,
    reviews: relatedReviews,
    traceItems
  })
})

generateSeedData()

app.listen(3001, () => {
  console.log('货站后端服务已启动 http://localhost:3001')
})
