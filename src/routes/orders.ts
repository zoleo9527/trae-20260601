import { Router, type Request, type Response } from 'express'
import { CreditOrderService, CreateOrderRequest, OrderApprovalRequest, OrderShipmentRequest, OrderCompletionRequest } from '../services/CreditOrderService'
import { IdempotentService } from '../services/IdempotentService'

const router = Router()
const orderService = new CreditOrderService()
const idempotentService = new IdempotentService()

router.post('/', async (req: Request, res: Response) => {
  try {
    const requestId = req.headers['x-request-id'] as string
    if (!requestId) {
      return res.status(400).json({ success: false, error: '缺少请求ID' })
    }

    const idempotentResult = await idempotentService.checkAndLock(requestId)
    if (!idempotentResult.isNew) {
      const cachedResponse = JSON.parse(idempotentResult.response!)
      return res.json(cachedResponse)
    }

    const request: CreateOrderRequest = req.body
    const result = await orderService.createOrder(request)
    
    await idempotentService.complete(requestId, JSON.stringify(result))
    res.status(result.success ? 201 : 400).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders()
    res.json({ success: true, data: orders })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/pending', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getPendingOrders()
    res.json({ success: true, data: orders })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId)
    res.json({ success: true, data: order })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.get('/farmer/:farmerId', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersByFarmerId(req.params.farmerId)
    res.json({ success: true, data: orders })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:orderId/approve', async (req: Request, res: Response) => {
  try {
    const request: OrderApprovalRequest = {
      orderId: req.params.orderId,
      ...req.body
    }
    const result = await orderService.approveOrder(request)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/:orderId/ship', async (req: Request, res: Response) => {
  try {
    const request: OrderShipmentRequest = {
      orderId: req.params.orderId,
      ...req.body
    }
    const result = await orderService.shipOrder(request)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/:orderId/complete', async (req: Request, res: Response) => {
  try {
    const request: OrderCompletionRequest = {
      orderId: req.params.orderId,
      ...req.body
    }
    const result = await orderService.completeOrder(request)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router