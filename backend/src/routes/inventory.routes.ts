import { Router, Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';
import { ApiResponse } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const record = inventoryService.createInventoryRecord(req.body);
    res.json({ success: true, data: record, message: '库存入账成功' } as ApiResponse<typeof record>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.post('/scrap', (req: Request, res: Response) => {
  try {
    const record = inventoryService.createScrapRecord(req.body);
    res.json({ success: true, data: record, message: '报废处理成功' } as ApiResponse<typeof record>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const records = inventoryService.getAllInventoryRecords();
  res.json({ success: true, data: records } as ApiResponse<typeof records>);
});

router.get('/reviews', (req: Request, res: Response) => {
  try {
    const records = inventoryService.getAllReviewRecords();
    res.json({ success: true, data: records } as ApiResponse<typeof records>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/reviews/batch/:batchId', (req: Request, res: Response) => {
  const records = inventoryService.getReviewRecordsByBatchId(req.params.batchId);
  res.json({ success: true, data: records } as ApiResponse<typeof records>);
});

router.get('/reviews/judgment/:judgmentId', (req: Request, res: Response) => {
  const records = inventoryService.getReviewRecordsByJudgmentId(req.params.judgmentId);
  res.json({ success: true, data: records } as ApiResponse<typeof records>);
});

router.get('/batch/:batchId', (req: Request, res: Response) => {
  const records = inventoryService.getInventoryRecordsByBatchId(req.params.batchId);
  res.json({ success: true, data: records } as ApiResponse<typeof records>);
});

router.get('/statistics/summary', (req: Request, res: Response) => {
  const summary = inventoryService.getInventorySummary();
  res.json({ success: true, data: summary } as ApiResponse<typeof summary>);
});

router.get('/:id', (req: Request, res: Response) => {
  const record = inventoryService.getInventoryRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, error: '库存记录不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: record } as ApiResponse<typeof record>);
});

export default router;
