import { Router } from 'express'
import type {
  CreateDetentionReq,
  Detention,
  SubmitReviewReq,
  SubmitResultReq,
  SubmitSuppReq,
} from '../src/types.js'
import { getDetentions, saveDetention } from './data.js'

const router = Router()

router.get('/detentions', (req, res) => {
  const status = req.query.status as string | undefined
  let list = getDetentions()
  if (status) {
    list = list.filter((d) => d.status === status)
  }
  res.json({ success: true, data: list })
})

router.get('/detentions/:id', (req, res) => {
  const d = getDetentions().find((item) => item.id === req.params.id)
  if (!d) {
    res.status(404).json({ success: false, message: '未找到该扣留记录' })
    return
  }
  res.json({ success: true, data: d })
})

router.post('/detentions', (req, res) => {
  const body = req.body as CreateDetentionReq
  if (!body.waybillNo || !body.goodsName || !body.inspector) {
    res.status(400).json({ success: false, message: '缺少必填字段' })
    return
  }

  const id = `DET-${Date.now()}`
  const now = new Date().toISOString()

  const d: Detention = {
    id,
    waybillNo: body.waybillNo,
    goodsName: body.goodsName,
    declaredGoodsName: body.declaredGoodsName,
    goodsCode: body.goodsCode,
    detainTime: now,
    detainReason: body.detainReason,
    detainBasis: body.detainBasis,
    inspector: body.inspector,
    receiver: body.receiver,
    warehouseImpact: body.warehouseImpact,
    status: 'detained',
    requiredDocs: body.requiredDocs.map((doc, i) => ({
      id: `rd-${id}-${i}`,
      ...doc,
    })),
    originalDocs: body.originalDocs.map((doc) => ({
      ...doc,
      status: 'normal' as const,
      remark: '',
    })),
    supplementaryDocs: [],
    reviews: [],
    finalResult: null,
    finalResultTime: null,
    finalResultBy: null,
    finalResultComment: null,
  }

  saveDetention(d)
  res.status(201).json({ success: true, data: d })
})

router.post('/detentions/:id/supplementary', (req, res) => {
  const d = getDetentions().find((item) => item.id === req.params.id)
  if (!d) {
    res.status(404).json({ success: false, message: '未找到该扣留记录' })
    return
  }

  if (d.status !== 'detained' && d.status !== 'supplementing') {
    res
      .status(400)
      .json({ success: false, message: '当前状态不允许提交补证材料' })
    return
  }

  const body = req.body as SubmitSuppReq
  if (!body.docName || !body.uploadedBy || !body.fileName) {
    res.status(400).json({ success: false, message: '缺少必填字段' })
    return
  }

  d.supplementaryDocs.push({
    id: `sd-${d.id}-${d.supplementaryDocs.length + 1}`,
    docName: body.docName,
    uploadTime: new Date().toISOString(),
    uploadedBy: body.uploadedBy,
    fileName: body.fileName,
    reviewStatus: 'pending',
    reviewComment: '',
  })

  d.status = 'supplementing'

  const allRequiredDocNames = d.requiredDocs.map((rd) => rd.docName)
  const submittedDocNames = d.supplementaryDocs.map((sd) => sd.docName)
  const allSubmitted = allRequiredDocNames.every((name) =>
    submittedDocNames.includes(name),
  )

  if (allSubmitted) {
    d.status = 'reviewing'
  }

  saveDetention(d)
  res.json({ success: true, data: d })
})

router.post('/detentions/:id/review', (req, res) => {
  const d = getDetentions().find((item) => item.id === req.params.id)
  if (!d) {
    res.status(404).json({ success: false, message: '未找到该扣留记录' })
    return
  }

  if (d.status !== 'reviewing') {
    res
      .status(400)
      .json({ success: false, message: '当前状态不允许提交复核意见' })
    return
  }

  const body = req.body as SubmitReviewReq
  if (!body.reviewer || !body.opinion || !body.comment) {
    res.status(400).json({ success: false, message: '缺少必填字段' })
    return
  }

  d.reviews.push({
    id: `rv-${d.id}-${d.reviews.length + 1}`,
    reviewer: body.reviewer,
    reviewTime: new Date().toISOString(),
    opinion: body.opinion,
    comment: body.comment,
  })

  const hasReject = d.reviews.some((r) => r.opinion === 'reject')
  if (hasReject) {
    d.status = 'supplementing'
  }

  saveDetention(d)
  res.json({ success: true, data: d })
})

router.put('/detentions/:id/result', (req, res) => {
  const d = getDetentions().find((item) => item.id === req.params.id)
  if (!d) {
    res.status(404).json({ success: false, message: '未找到该扣留记录' })
    return
  }

  if (d.status !== 'reviewing') {
    res
      .status(400)
      .json({ success: false, message: '当前状态不允许设置最终结果' })
    return
  }

  const body = req.body as SubmitResultReq
  if (!body.result || !body.operator || !body.comment) {
    res.status(400).json({ success: false, message: '缺少必填字段' })
    return
  }

  d.finalResult = body.result
  d.finalResultTime = new Date().toISOString()
  d.finalResultBy = body.operator
  d.finalResultComment = body.comment
  d.status = body.result

  saveDetention(d)
  res.json({ success: true, data: d })
})

export default router
