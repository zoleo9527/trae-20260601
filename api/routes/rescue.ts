import { Router, type Request, type Response } from 'express'
import { readData, writeData, generateId } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  const { date, patrolId, severity } = req.query
  let result = data.rescueRecords

  if (date && typeof date === 'string') {
    result = result.filter((r) => r.date === date)
  }
  if (patrolId && typeof patrolId === 'string') {
    result = result.filter((r) => r.patrolId === patrolId)
  }
  if (severity && typeof severity === 'string') {
    const severityMap: Record<string, string> = { low: 'minor', medium: 'moderate', high: 'severe' }
    const mappedSeverity = severityMap[severity] || severity
    result = result.filter((r) => r.severity === mappedSeverity)
  }

  const joined = result.map((r) => {
    const patrol = data.patrols.find((p) => p.id === r.patrolId)
    return {
      ...r,
      patrolName: patrol?.name,
    }
  })

  res.json({ success: true, data: joined })
})

router.post('/', (req: Request, res: Response): void => {
  const { date, location, description, patientName, severity, attachments, patrolId } = req.body

  if (!date || !location || !description || !patientName || !severity || !patrolId) {
    res.status(400).json({ success: false, error: 'date, location, description, patientName, severity, patrolId are required' })
    return
  }

  const validSeverities = ['minor', 'moderate', 'severe']
  if (!validSeverities.includes(severity)) {
    res.status(400).json({ success: false, error: `severity must be one of: ${validSeverities.join(', ')}` })
    return
  }

  const data = readData()
  const patrol = data.patrols.find((p) => p.id === patrolId)
  if (!patrol) {
    res.status(404).json({ success: false, error: 'Patrol not found' })
    return
  }

  if (!Array.isArray(attachments) || attachments.length < 1) {
    res.status(400).json({ success: false, error: 'At least 1 attachment is required' })
    return
  }

  const processedAttachments = attachments.map((a: { id?: string; name: string; type: string; url?: string; isPlaceholder?: boolean; fileName?: string; fileType?: string; size?: string }) => ({
    id: a.id || generateId(),
    name: a.name || a.fileName || '未命名',
    type: a.type || a.fileType || 'other',
    url: a.url,
    isPlaceholder: a.isPlaceholder !== undefined ? a.isPlaceholder : !a.url,
  }))

  const record = {
    id: generateId(),
    date,
    location,
    description,
    patientName,
    severity,
    patrolId,
    attachments: processedAttachments,
  }
  data.rescueRecords.push(record)
  writeData(data)

  res.json({ success: true, data: { ...record, patrolName: patrol.name } })
})

router.patch('/:id/attachments', (req: Request, res: Response): void => {
  const { id } = req.params
  const { attachments, attachmentId, isPlaceholder, url, name } = req.body

  const data = readData()
  const record = data.rescueRecords.find((r) => r.id === id)
  if (!record) {
    res.status(404).json({ success: false, error: 'Rescue record not found' })
    return
  }

  if (attachmentId) {
    const attachment = record.attachments.find((a) => a.id === attachmentId)
    if (!attachment) {
      res.status(404).json({ success: false, error: 'Attachment not found' })
      return
    }
    if (isPlaceholder !== undefined) attachment.isPlaceholder = isPlaceholder
    if (url !== undefined) {
      attachment.url = url
      if (url) attachment.isPlaceholder = false
    }
    if (name !== undefined) attachment.name = name
  } else if (Array.isArray(attachments)) {
    record.attachments = attachments.map((a: { id?: string; name?: string; fileName?: string; type?: string; fileType?: string; url?: string; isPlaceholder?: boolean; size?: string }) => ({
      id: a.id || generateId(),
      name: a.name || a.fileName || '未命名',
      type: a.type || a.fileType || 'other',
      url: a.url,
      isPlaceholder: a.isPlaceholder !== undefined ? a.isPlaceholder : !a.url,
    }))
  } else {
    res.status(400).json({ success: false, error: 'Either attachmentId (for single update) or attachments (for full replace) is required' })
    return
  }

  writeData(data)
  res.json({ success: true, data: record })
})

export default router
