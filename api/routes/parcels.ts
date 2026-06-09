import { Router, type Request, type Response } from 'express'
import {
    batchScan,
    dispatchParcels,
    getParcelAuditLog,
    getParcels,
    getProblems,
    getWorkspaceSummary,
    reportProblem,
    resolveProblem,
    scanAndDispatch,
    scanParcel,
    signParcels,
    startDelivery,
} from '../services/parcelService.js'

const router = Router()

router.post('/scan', (req: Request, res: Response): void => {
  try {
    const { trackingNo, operatorId, note } = req.body
    if (!trackingNo || !operatorId) {
      res.status(400).json({ success: false, error: 'trackingNo 和 operatorId 必填' })
      return
    }
    const data = scanParcel(trackingNo, operatorId, note)
    res.json({ success: true, data })
  } catch (err: any) {
    const status = err.message?.includes('已存在') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/scan/batch', (req: Request, res: Response): void => {
  try {
    const { items, operatorId, note } = req.body
    if (!items || !Array.isArray(items) || items.length === 0 || !operatorId) {
      res.status(400).json({ success: false, error: 'items（非空数组）和 operatorId 必填' })
      return
    }
    const parcels = batchScan(items, operatorId, note)
    res.json({ success: true, data: { count: parcels.length, parcels } })
  } catch (err: any) {
    const status = err.message?.includes('已存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/scan-dispatch', (req: Request, res: Response): void => {
  try {
    const { items, assigneeId, assigneeType, operatorId, note } = req.body
    if (!items || !Array.isArray(items) || items.length === 0 || !assigneeId || !assigneeType || !operatorId) {
      res.status(400).json({ success: false, error: 'items（非空数组）、assigneeId、assigneeType 和 operatorId 必填' })
      return
    }
    if (assigneeType !== 'courier' && assigneeType !== 'station') {
      res.status(400).json({ success: false, error: 'assigneeType 必须为 courier 或 station' })
      return
    }
    const parcels = scanAndDispatch(items, assigneeId, assigneeType, operatorId, note)
    res.json({ success: true, data: { count: parcels.length, parcels } })
  } catch (err: any) {
    const status = err.message?.includes('已存在') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/dispatch', (req: Request, res: Response): void => {
  try {
    const { parcelIds, assigneeId, assigneeType, note, operatorId } = req.body
    if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0 || !assigneeId || !assigneeType || !operatorId) {
      res.status(400).json({ success: false, error: 'parcelIds、assigneeId、assigneeType 和 operatorId 必填' })
      return
    }
    const parcels = dispatchParcels(parcelIds, assigneeId, assigneeType, note, operatorId)
    res.json({ success: true, data: { count: parcels.length, parcels } })
  } catch (err: any) {
    const status = err.message?.includes('不允许') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/deliver', (req: Request, res: Response): void => {
  try {
    const { parcelId, operatorId, note } = req.body
    if (!parcelId || !operatorId) {
      res.status(400).json({ success: false, error: 'parcelId 和 operatorId 必填' })
      return
    }
    const data = startDelivery(parcelId, operatorId, note)
    res.json({ success: true, data: { parcel: data } })
  } catch (err: any) {
    const status = err.message?.includes('不允许') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/sign', (req: Request, res: Response): void => {
  try {
    const { parcelIds, operatorId, note } = req.body
    if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0 || !operatorId) {
      res.status(400).json({ success: false, error: 'parcelIds 和 operatorId 必填' })
      return
    }
    const parcels = signParcels(parcelIds, operatorId, note)
    res.json({ success: true, data: { count: parcels.length, parcels } })
  } catch (err: any) {
    const status = err.message?.includes('不允许') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.post('/problem', (req: Request, res: Response): void => {
  try {
    const { parcelId, problemType, operatorId, note } = req.body
    if (!parcelId || !problemType || !operatorId) {
      res.status(400).json({ success: false, error: 'parcelId、problemType 和 operatorId 必填' })
      return
    }
    const data = reportProblem(parcelId, problemType, operatorId, note)
    res.json({ success: true, data: { parcel: data } })
  } catch (err: any) {
    const status = err.message?.includes('不允许') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.put('/problem/:id/resolve', (req: Request, res: Response): void => {
  try {
    const parcelId = Number(req.params.id)
    const { resolution, operatorId, note } = req.body
    if (!resolution || !operatorId) {
      res.status(400).json({ success: false, error: 'resolution 和 operatorId 必填' })
      return
    }
    const data = resolveProblem(parcelId, resolution, operatorId, note)
    res.json({ success: true, data: { parcel: data } })
  } catch (err: any) {
    const status = err.message?.includes('不允许') || err.message?.includes('不存在') ? 400 : 500
    res.status(status).json({ success: false, error: err.message })
  }
})

router.get('/problems', (_req: Request, res: Response): void => {
  try {
    const data = getProblems()
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/workspace/summary', (req: Request, res: Response): void => {
  try {
    const { responsibleId, responsibleType } = req.query as Record<string, string | undefined>
    const summary = getWorkspaceSummary(
      responsibleId ? Number(responsibleId) : undefined,
      responsibleType
    )
    res.json({ success: true, data: summary })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/audit-log', (req: Request, res: Response): void => {
  try {
    const parcelId = Number(req.params.id)
    const logs = getParcelAuditLog(parcelId)
    res.json({ success: true, data: { logs } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, assigneeId, responsibleId, responsibleType, trackingNo, startDate, endDate, page, pageSize } = req.query as Record<string, string | undefined>
    const result = getParcels({
      status,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
      responsibleId: responsibleId ? Number(responsibleId) : undefined,
      responsibleType,
      trackingNo,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
