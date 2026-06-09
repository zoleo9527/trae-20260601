import { Router, type Request, type Response } from 'express'
import * as outboundService from '../services/outbound.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  try {
    const { orderNo, customerId, customerName, customerQualExpiry, items, idempotencyKey } = req.body
    if (!orderNo || !customerId || !customerName || !customerQualExpiry || !items || !Array.isArray(items) || !idempotencyKey) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const result = outboundService.createOrder({
      orderNo,
      customerId,
      customerName,
      customerQualExpiry,
      items,
      idempotencyKey,
    })
    res.status(201).json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '创建出库单失败' })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string | undefined
    const orders = outboundService.listOrders(status)
    res.json({ success: true, data: { total: orders.length, items: orders } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '获取出库单列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const detail = outboundService.getOrderDetail(req.params.id)
    if (!detail) {
      res.status(404).json({ success: false, error: '出库单不存在' })
      return
    }
    res.json({ success: true, data: detail })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '获取出库单详情失败' })
  }
})

router.put('/:id/submit', (req: Request, res: Response): void => {
  try {
    const { submittedBy, idempotencyKey } = req.body
    if (!submittedBy || !idempotencyKey) {
      res.status(400).json({ success: false, error: '缺少必要参数 submittedBy 或 idempotencyKey' })
      return
    }

    const order = outboundService.submitOrder(req.params.id, { submittedBy, idempotencyKey })
    res.json({ success: true, data: order })
  } catch (error: any) {
    if (error.message.includes('不允许提交') || error.message.includes('不存在')) {
      res.status(400).json({ success: false, error: error.message })
      return
    }
    res.status(500).json({ success: false, error: error.message || '提交出库单失败' })
  }
})

router.put('/:id/review', (req: Request, res: Response): void => {
  try {
    const { reviewedBy, reviewItems, idempotencyKey } = req.body
    if (!reviewedBy || !reviewItems || !Array.isArray(reviewItems) || !idempotencyKey) {
      res.status(400).json({ success: false, error: '缺少必要参数 reviewedBy、reviewItems 或 idempotencyKey' })
      return
    }

    const order = outboundService.reviewOrder(req.params.id, { reviewedBy, reviewItems, idempotencyKey })
    res.json({ success: true, data: order })
  } catch (error: any) {
    if (error.message.includes('不允许复核') || error.message.includes('不存在')) {
      res.status(400).json({ success: false, error: error.message })
      return
    }
    res.status(500).json({ success: false, error: error.message || '复核出库单失败' })
  }
})

export default router
