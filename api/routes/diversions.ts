import { Router, type Request, type Response } from 'express'
import {
  findDiversion,
  findDiversionLogs,
  findAttachments,
  findFirstPlaceholderAttachment,
  addDiversionLog,
  addAttachment,
  updateAttachment,
  updateDiversion,
  getDiversions,
} from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, urgency, keyword } = req.query

  let result = [...getDiversions()]

  if (status && typeof status === 'string') {
    result = result.filter((d) => d.status === status)
  }

  if (urgency && typeof urgency === 'string') {
    result = result.filter((d) => d.urgency === urgency)
  }

  if (keyword && typeof keyword === 'string') {
    const kw = keyword.toLowerCase()
    result = result.filter(
      (d) =>
        d.patientName.toLowerCase().includes(kw) ||
        d.examNo.toLowerCase().includes(kw),
    )
  }

  res.json(result)
})

router.get('/:id', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }
  res.json(diversion)
})

router.get('/:id/logs', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }
  res.json(findDiversionLogs(req.params.id))
})

router.get('/:id/attachments', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }
  res.json(findAttachments(req.params.id))
})

router.post('/:id/divert', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  if (diversion.status !== 'pending' && diversion.status !== 'rejected') {
    res.status(400).json({ error: 'Only pending or rejected diversions can be diverted' })
    return
  }

  const { assignedDept, assignedDoctor, operatorName } = req.body
  if (!assignedDept) {
    res.status(400).json({ error: 'assignedDept is required' })
    return
  }

  const updated = updateDiversion(diversion.id, {
    status: 'diverted',
    assignedDept,
    assignedDoctor: assignedDoctor || null,
  })

  const doctorText = assignedDoctor ? `，指定${assignedDoctor}` : ''
  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'front_desk',
    operatorName: operatorName || '前台导检员',
    action: 'divert',
    detail: `提交导检分流至${assignedDept}${doctorText}`,
  })

  res.json(updated)
})

router.post('/:id/confirm', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  if (diversion.status !== 'diverted') {
    res.status(400).json({ error: 'Only diverted diversions can be confirmed' })
    return
  }

  const { operatorName } = req.body

  const updated = updateDiversion(diversion.id, {
    status: 'confirmed',
  })

  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'doctor',
    operatorName: operatorName || diversion.assignedDoctor || '科室医生',
    action: 'confirm',
    detail: '科室医生确认接收分流患者',
  })

  res.json(updated)
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  if (diversion.status !== 'confirmed') {
    res.status(400).json({ error: 'Only confirmed diversions can be completed' })
    return
  }

  const { operatorName } = req.body

  const updated = updateDiversion(diversion.id, {
    status: 'completed',
  })

  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'doctor',
    operatorName: operatorName || diversion.assignedDoctor || '科室医生',
    action: 'complete',
    detail: '科室医生标记检查完成，待审核',
  })

  res.json(updated)
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  if (diversion.status !== 'completed') {
    res.status(400).json({ error: 'Only completed diversions can be rejected' })
    return
  }

  const { reason, operatorName } = req.body
  if (!reason) {
    res.status(400).json({ error: 'reason is required' })
    return
  }

  const updated = updateDiversion(diversion.id, {
    status: 'rejected',
    assignedDept: null,
    assignedDoctor: null,
  })

  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'reviewer',
    operatorName: operatorName || '报告审核员',
    action: 'reject',
    detail: `复核不通过：${reason}`,
  })

  res.json(updated)
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  if (diversion.status !== 'completed') {
    res.status(400).json({ error: 'Only completed diversions can be approved' })
    return
  }

  const { operatorName } = req.body

  const updated = updateDiversion(diversion.id, {
    status: 'approved',
  })

  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'reviewer',
    operatorName: operatorName || '报告审核员',
    action: 'approve',
    detail: '报告审核通过，流程完成',
  })

  res.json(updated)
})

router.post('/:id/attachments', (req: Request, res: Response): void => {
  const diversion = findDiversion(req.params.id)
  if (!diversion) {
    res.status(404).json({ error: 'Diversion not found' })
    return
  }

  const { fileType, fileName, operatorName } = req.body
  if (!fileType || !fileName) {
    res.status(400).json({ error: 'fileType and fileName are required' })
    return
  }

  const now = new Date().toISOString()
  const uploader = operatorName || '前台导检员'
  const fileUrl = `/uploads/${Date.now()}_${fileName}`

  let attachment
  const placeholder = findFirstPlaceholderAttachment(diversion.id)

  if (placeholder) {
    attachment = updateAttachment(placeholder.id, {
      fileName,
      fileType,
      fileUrl,
      uploadedAt: now,
      uploadedBy: uploader,
    })
  } else {
    attachment = addAttachment(
      {
        diversionId: diversion.id,
        fileName,
        fileType,
        fileUrl,
        uploadedAt: now,
        uploadedBy: uploader,
      },
      uploader
    )
  }

  addDiversionLog({
    diversionId: diversion.id,
    operatorRole: 'front_desk',
    operatorName: uploader,
    action: 'upload_attachment',
    detail: `上传附件：${fileName}（${fileType}）`,
  })

  res.status(201).json(attachment)
})

export default router
