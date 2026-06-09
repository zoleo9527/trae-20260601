import { Router, type Request, type Response } from 'express'
import * as batchIssueService from '../services/batch-issue.js'

const router = Router()

router.put('/:id/process', (req: Request, res: Response): void => {
  try {
    const { processedBy, processResult, processNote, newBatchNo, newExpiryDate, idempotencyKey } = req.body
    if (!processedBy || !processResult || !idempotencyKey) {
      res.status(400).json({ success: false, error: '缺少必要参数 processedBy、processResult 或 idempotencyKey' })
      return
    }

    if (!['exchange', 'return', 'special_approval'].includes(processResult)) {
      res.status(400).json({ success: false, error: 'processResult 必须为 exchange、return 或 special_approval' })
      return
    }

    const issue = batchIssueService.processBatchIssue(req.params.id, {
      processedBy,
      processResult,
      processNote: processNote ?? '',
      newBatchNo,
      newExpiryDate,
      idempotencyKey,
    })
    res.json({ success: true, data: issue })
  } catch (error: any) {
    if (error.message.includes('不存在') || error.message.includes('已处理')) {
      res.status(400).json({ success: false, error: error.message })
      return
    }
    res.status(500).json({ success: false, error: error.message || '处理批号异常失败' })
  }
})

export default router
