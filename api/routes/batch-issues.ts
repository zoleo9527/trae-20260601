import { Router, type Request, type Response } from 'express'
import * as batchIssueService from '../services/batch-issue.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const processStatus = req.query.processStatus as string | undefined
    const issues = batchIssueService.listBatchIssues(processStatus)
    res.json({ success: true, data: { total: issues.length, items: issues } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '获取批号异常列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const detail = batchIssueService.getBatchIssueDetail(req.params.id)
    if (!detail) {
      res.status(404).json({ success: false, error: '批号异常工单不存在' })
      return
    }
    res.json({ success: true, data: detail })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '获取批号异常详情失败' })
  }
})

export default router
