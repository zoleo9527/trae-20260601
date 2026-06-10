import { Router, type Request, type Response } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { gradeService } from '../services/gradeService'
import { EggGrade } from '../types'

const router = Router()

router.post('/', async (req: Request<ParamsDictionary, any, { batchNumber: string; grade: string; quantity: number; weight: number; breederId: string }>, res: Response) => {
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

router.put('/:id/verify', async (req: Request<{ id: string }, any, { sorterId: string }>, res: Response) => {
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

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
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

router.get('/', async (req: Request<ParamsDictionary, any, any, Query & { batchNumber?: string; grade?: string; status?: string; breederId?: string; sorterId?: string; startDate?: string; endDate?: string; page?: string; pageSize?: string }>, res: Response) => {
  try {
    const { batchNumber, grade, status, breederId, sorterId, startDate, endDate, page, pageSize } = req.query
    const filter = {
      batchNumber: batchNumber || undefined,
      grade: (grade as EggGrade) || undefined,
      status: status || undefined,
      breederId: breederId || undefined,
      sorterId: sorterId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }
    const pageRequest = {
      page: parseInt(page || '1'),
      pageSize: parseInt(pageSize || '10')
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

router.get('/:id/logs', async (req: Request<{ id: string }>, res: Response) => {
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