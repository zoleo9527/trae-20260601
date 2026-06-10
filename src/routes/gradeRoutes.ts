import { Router, Request, Response } from 'express'
import { gradeService } from '../services/gradeService'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { batchNumber, grade, quantity, weight, breederId } = req.body
    const record = await gradeService.submitGradeRecord(batchNumber, grade, quantity, weight, breederId)
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

router.put('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { sorterId } = req.body
    const record = await gradeService.verifyGradeRecord(id, sorterId)
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
    const record = await gradeService.getGradeRecordById(id)
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
    const { batchNumber, grade, status, breederId, sorterId, startDate, endDate, page, pageSize } = req.query
    const filter = {
      batchNumber: batchNumber as string,
      grade: grade as string,
      status: status as string,
      breederId: breederId as string,
      sorterId: sorterId as string,
      startDate: startDate as string,
      endDate: endDate as string
    }
    const pageRequest = {
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10
    }
    const result = await gradeService.getGradeRecords(filter, pageRequest)
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
    const logs = await gradeService.getGradeRecordLogs(id)
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