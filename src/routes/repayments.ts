import { Router, type Request, type Response } from 'express'
import { RepaymentService, RepaymentRequest } from '../services/RepaymentService'

const router = Router()
const repaymentService = new RepaymentService()

router.get('/', async (req: Request, res: Response) => {
  try {
    const repayments = await repaymentService.getPendingRepayments()
    res.json({ success: true, data: repayments })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:repaymentId', async (req: Request, res: Response) => {
  try {
    const repayment = await repaymentService.getRepaymentById(req.params.repaymentId)
    res.json({ success: true, data: repayment })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.get('/farmer/:farmerId', async (req: Request, res: Response) => {
  try {
    const repayments = await repaymentService.getRepaymentsByFarmerId(req.params.farmerId)
    res.json({ success: true, data: repayments })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:repaymentId/pay', async (req: Request, res: Response) => {
  try {
    const request: RepaymentRequest = {
      repaymentId: req.params.repaymentId,
      ...req.body
    }
    const repayment = await repaymentService.makePayment(request)
    res.json({ success: true, data: repayment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/farmer/:farmerId/summary', async (req: Request, res: Response) => {
  try {
    const summary = await repaymentService.getFarmerDebtSummary(req.params.farmerId)
    res.json({ success: true, data: summary })
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message })
  }
})

router.get('/debts/all', async (req: Request, res: Response) => {
  try {
    const summaries = await repaymentService.getAllPendingDebts()
    res.json({ success: true, data: summaries })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router