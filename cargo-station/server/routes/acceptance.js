import { Router } from 'express'
import { beijingNow, getDB, mutateDB, nowISO } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { acceptanceRecords } = getDB()
  let filtered = [...acceptanceRecords]

  if (req.query.status) {
    filtered = filtered.filter(r => r.status === req.query.status)
  }
  if (req.query.cargoType) {
    filtered = filtered.filter(r => r.cargoType === req.query.cargoType)
  }
  if (req.query.waybillNo) {
    filtered = filtered.filter(r => r.waybillNo.includes(req.query.waybillNo))
  }
  if (req.query.flightNo) {
    filtered = filtered.filter(r => r.flightNo.includes(req.query.flightNo))
  }
  if (req.query.shipper) {
    filtered = filtered.filter(r => r.shipper.includes(req.query.shipper))
  }

  const sortField = req.query.sortBy || 'id'
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1
  filtered.sort((a, b) => {
    if (sortField === 'weight' || sortField === 'pieces' || sortField === 'id') {
      return (a[sortField] - b[sortField]) * sortOrder
    }
    return String(a[sortField]).localeCompare(String(b[sortField])) * sortOrder
  })

  res.json({ total: filtered.length, data: filtered })
})

router.get('/:id', (req, res) => {
  const { acceptanceRecords } = getDB()
  const record = acceptanceRecords.find(r => r.id === Number(req.params.id))
  if (!record) return res.status(404).json({ error: '受理记录不存在' })
  res.json(record)
})

router.post('/', (req, res) => {
  const data = mutateDB(({ acceptanceRecords, PERSONNEL, STATUS_FLOW }) => {
    const { flightNo, shipper, cargoType, weight, pieces } = req.body
    if (!flightNo || !shipper || !cargoType || !weight || !pieces) {
      return { nextAcceptanceId: 0, data: null }
    }
    const id = acceptanceRecords.length + 1
    const waybillNo = `${flightNo}-${String(id).padStart(4, '0')}`
    const record = {
      id,
      waybillNo,
      flightNo,
      shipper,
      cargoType,
      weight: Number(weight),
      pieces: Number(pieces),
      status: '待受理',
      currentHandler: '货站受理岗',
      currentHandlerRole: 'station_receiver',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
    acceptanceRecords.push(record)
    return { nextAcceptanceId: id + 1, data: record }
  })

  if (!data) return res.status(400).json({ error: '缺少必填字段' })
  res.status(201).json(data)
})

router.put('/:id/status', (req, res) => {
  const { targetStatus, operator, operatorRole, note } = req.body

  const data = mutateDB(({ acceptanceRecords, verificationRecords, auditLogs, PERSONNEL, STATUS_FLOW, DOC_TYPES }) => {
    const record = acceptanceRecords.find(r => r.id === Number(req.params.id))
    if (!record) return { data: null }

    const allowed = STATUS_FLOW[record.status] || []
    if (!allowed.includes(targetStatus)) {
      return { data: { error: `当前状态[${record.status}]不允许流转到[${targetStatus}]，允许的目标: [${allowed.join(', ')}]` } }
    }

    const fromStatus = record.status
    record.status = targetStatus

    const handlerMap = {
      '待受理': ['货站受理岗', 'station_receiver'],
      '受理中': ['货站受理岗', 'station_receiver'],
      '待单证校验': ['安检校验岗', 'security_inspector'],
      '单证校验中': ['安检校验岗', 'security_inspector'],
      '校验退回': ['货站受理岗', 'station_receiver'],
      '校验通过': ['库区调度岗', 'warehouse_dispatcher'],
      '待入库': ['库区调度岗', 'warehouse_dispatcher'],
      '已入库': ['库区调度岗', 'warehouse_dispatcher'],
    }
    const [handler, role] = handlerMap[targetStatus] || ['', '']
    record.currentHandler = handler
    record.currentHandlerRole = role
    record.updatedAt = nowISO()

    const auditEntry = {
      id: auditLogs.length + 1,
      recordId: record.id,
      recordType: 'acceptance',
      fromStatus,
      toStatus: targetStatus,
      operator: operator || handler,
      operatorRole: operatorRole || role,
      note: note || '',
      timestamp: nowISO(),
      displayTime: beijingNow()
    }
    auditLogs.push(auditEntry)

    if (targetStatus === '待单证校验') {
      let verification = verificationRecords.find(v => v.acceptanceId === record.id)
      if (!verification) {
        const docs = DOC_TYPES.filter(d => {
          if (record.cargoType === '普货' || record.cargoType === '纺织品' || record.cargoType === '文件资料') {
            return ['航空运单', '安检申报单', '货物交接清单'].includes(d)
          }
          if (record.cargoType === '锂电池' || record.cargoType === '危险化学品') {
            return true
          }
          if (record.cargoType === '生鲜冷链') {
            return ['航空运单', '安检申报单', '货物交接清单', '温控记录单'].includes(d)
          }
          if (record.cargoType === '药品') {
            return ['航空运单', '安检申报单', '货物交接清单', '特殊货物审批件', '温控记录单'].includes(d)
          }
          if (record.cargoType === '精密仪器') {
            return ['航空运单', '安检申报单', '货物交接清单', '特殊货物审批件'].includes(d)
          }
          return ['航空运单', '安检申报单', '货物交接清单'].includes(d)
        })

        verification = {
          id: verificationRecords.length + 1,
          acceptanceId: record.id,
          waybillNo: record.waybillNo,
          documents: docs.map(docName => ({
            docType: docName,
            submitted: false,
            verified: false,
            hasIssue: false,
            issueNote: '',
            submittedBy: '',
            submittedAt: '',
            verifiedBy: '',
            verifiedAt: ''
          })),
          overallResult: '待校验',
          rejectReason: '',
          verifiedBy: '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
        verificationRecords.push(verification)
      }
    }

    return { data: { record, auditEntry } }
  })

  if (!data) return res.status(404).json({ error: '受理记录不存在' })
  if (data.error) return res.status(400).json({ error: data.error })
  res.json(data)
})

router.get('/personnel/list', (req, res) => {
  const { PERSONNEL } = getDB()
  res.json(PERSONNEL)
})

router.get('/meta/statuses', (req, res) => {
  const { STATUS_FLOW } = getDB()
  res.json(STATUS_FLOW)
})

export { router as acceptanceRouter }
