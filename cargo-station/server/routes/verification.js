import { Router } from 'express'
import { beijingNow, getDB, mutateDB, nowISO } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { verificationRecords } = getDB()
  let filtered = [...verificationRecords]
  if (req.query.acceptanceId) {
    filtered = filtered.filter(v => v.acceptanceId === Number(req.query.acceptanceId))
  }
  if (req.query.waybillNo) {
    filtered = filtered.filter(v => v.waybillNo.includes(req.query.waybillNo))
  }
  if (req.query.result) {
    filtered = filtered.filter(v => v.overallResult === req.query.result)
  }
  if (req.query.operator) {
    filtered = filtered.filter(v => {
      const names = new Set()
      for (const doc of v.documents) {
        if (doc.submittedBy) names.add(doc.submittedBy)
        if (doc.verifiedBy) names.add(doc.verifiedBy)
      }
      if (v.verifiedBy) names.add(v.verifiedBy)
      return names.has(req.query.operator)
    })
  }
  if (req.query.dateFrom) {
    const from = new Date(req.query.dateFrom)
    filtered = filtered.filter(v => new Date(v.updatedAt) >= from)
  }
  if (req.query.dateTo) {
    const to = new Date(req.query.dateTo)
    to.setHours(23, 59, 59, 999)
    filtered = filtered.filter(v => new Date(v.updatedAt) <= to)
  }
  res.json({ total: filtered.length, data: filtered })
})

router.get('/:id', (req, res) => {
  const { verificationRecords } = getDB()
  const record = verificationRecords.find(v => v.id === Number(req.params.id))
  if (!record) return res.status(404).json({ error: '校验记录不存在' })
  res.json(record)
})

router.put('/:id/verify', (req, res) => {
  const { docType, passed, issueNote, operator, operatorRole } = req.body

  const data = mutateDB(({ verificationRecords, acceptanceRecords, auditLogs }) => {
    const verification = verificationRecords.find(v => v.id === Number(req.params.id))
    if (!verification) return { data: null }

    const doc = verification.documents.find(d => d.docType === docType)
    if (!doc) return { data: { error: `单证类型[${docType}]不存在于此校验记录中` } }

    doc.verified = passed
    doc.hasIssue = !passed
    doc.issueNote = issueNote || ''
    doc.verifiedBy = operator || ''
    doc.verifiedAt = nowISO()
    verification.updatedAt = nowISO()

    const acceptance = acceptanceRecords.find(a => a.id === verification.acceptanceId)

    const allSubmitted = verification.documents.every(d => d.submitted)
    const allVerified = verification.documents.every(d => d.verified)
    const anyRejected = verification.documents.some(d => d.hasIssue)

    if (allVerified && !anyRejected) {
      verification.overallResult = '通过'
      verification.verifiedBy = operator || ''
    } else if (anyRejected) {
      verification.overallResult = '有异常'
    }

    return { data: { verification, acceptanceId: verification.acceptanceId } }
  })

  if (!data) return res.status(404).json({ error: '校验记录不存在' })
  if (data.error) return res.status(400).json({ error: data.error })
  res.json(data)
})

router.put('/:id/submit-doc', (req, res) => {
  const { docType, operator, operatorRole } = req.body

  const data = mutateDB(({ verificationRecords }) => {
    const verification = verificationRecords.find(v => v.id === Number(req.params.id))
    if (!verification) return { data: null }

    const doc = verification.documents.find(d => d.docType === docType)
    if (!doc) return { data: { error: `单证类型[${docType}]不存在` } }

    doc.submitted = true
    doc.submittedBy = operator || ''
    doc.submittedAt = nowISO()
    verification.updatedAt = nowISO()

    return { data: verification }
  })

  if (!data) return res.status(404).json({ error: '校验记录不存在' })
  if (data.error) return res.status(400).json({ error: data.error })
  res.json(data)
})

router.put('/:id/complete', (req, res) => {
  const { result, rejectReason, operator, operatorRole } = req.body

  const data = mutateDB(({ verificationRecords, acceptanceRecords, auditLogs }) => {
    const verification = verificationRecords.find(v => v.id === Number(req.params.id))
    if (!verification) return { data: null }

    verification.overallResult = result
    verification.rejectReason = rejectReason || ''
    verification.verifiedBy = operator || ''
    verification.updatedAt = nowISO()

    const acceptance = acceptanceRecords.find(a => a.id === verification.acceptanceId)
    if (!acceptance) return { data: { error: '关联受理记录不存在' } }

    let targetStatus
    let auditNote
    if (result === '通过') {
      targetStatus = '校验通过'
      auditNote = `单证校验通过，操作人: ${operator || '安检员'}`
    } else if (result === '退回') {
      targetStatus = '校验退回'
      auditNote = `单证校验退回，原因: ${rejectReason || '未说明'}，操作人: ${operator || '安检员'}`
    } else {
      return { data: { error: `不支持的整体校验结果: ${result}` } }
    }

    const fromStatus = acceptance.status
    acceptance.status = targetStatus

    const handlerMap = {
      '校验通过': ['库区调度岗', 'warehouse_dispatcher'],
      '校验退回': ['货站受理岗', 'station_receiver'],
    }
    const [handler, role] = handlerMap[targetStatus] || ['', '']
    acceptance.currentHandler = handler
    acceptance.currentHandlerRole = role
    acceptance.updatedAt = nowISO()

    const auditEntry = {
      id: auditLogs.length + 1,
      recordId: acceptance.id,
      recordType: 'acceptance',
      fromStatus,
      toStatus: targetStatus,
      operator: operator || handler,
      operatorRole: operatorRole || role,
      note: auditNote,
      timestamp: nowISO(),
      displayTime: beijingNow()
    }
    auditLogs.push(auditEntry)

    return { data: { verification, acceptance, auditEntry } }
  })

  if (!data) return res.status(404).json({ error: '校验记录不存在' })
  if (data.error) return res.status(400).json({ error: data.error })
  res.json(data)
})

export { router as verificationRouter }
