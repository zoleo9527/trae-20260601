import { Router, Request, Response } from 'express'
import { packingService } from '../services/packingService'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { eggGradeRecordId, boxCount, eggsPerBox, destination, transporter, managerId } = req.body
    const record = await packingService.confirmPacking(eggGradeRecordId, boxCount, eggsPerBox, destination, transporter, managerId)
    res.status(201).json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

router.put('/:id/ship', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { operatorId } = req.body
    const record = await packingService.shipPacking(id, operatorId)
    res.json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const record = await packingService.getPackingRecordById(id)
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      })
    }
    res.json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const { batchNumber, destination, status, managerId, startDate, endDate, page, pageSize } = req.query
    const filter = {
      batchNumber: batchNumber as string,
      destination: destination as string,
      status: status as string,
      managerId: managerId as string,
      startDate: startDate as string,
      endDate: endDate as string
    }
    const pageRequest = {
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10
    }
    const result = await packingService.getPackingRecords(filter, pageRequest)
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const logs = await packingService.getPackingRecordLogs(id)
    res.json({
      success: true,
      data: logs
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

export default router