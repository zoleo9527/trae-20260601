import { Router, Request, Response } from 'express';
import * as batchService from '../services/batch.service';
import { ApiResponse, BatchStatus } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const batch = batchService.createInboundBatch(req.body);
    res.json({ success: true, data: batch, message: '批次创建成功' } as ApiResponse<typeof batch>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const status = req.query.status as BatchStatus | undefined;
  const batches = batchService.getAllInboundBatches(status);
  res.json({ success: true, data: batches } as ApiResponse<typeof batches>);
});

router.get('/:id', (req: Request, res: Response) => {
  const batch = batchService.getInboundBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({ success: false, error: '批次不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: batch } as ApiResponse<typeof batch>);
});

router.get('/no/:batchNo', (req: Request, res: Response) => {
  const batch = batchService.getInboundBatchByNo(req.params.batchNo);
  if (!batch) {
    return res.status(404).json({ success: false, error: '批次不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: batch } as ApiResponse<typeof batch>);
});

router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const success = batchService.updateBatchStatus(req.params.id, status);
  if (!success) {
    return res.status(404).json({ success: false, error: '批次不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, message: '状态更新成功' } as ApiResponse<null>);
});

router.get('/statistics/summary', (req: Request, res: Response) => {
  const stats = batchService.getBatchStatistics();
  res.json({ success: true, data: stats } as ApiResponse<typeof stats>);
});

export default router;
