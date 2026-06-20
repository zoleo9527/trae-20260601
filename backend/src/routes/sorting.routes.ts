import { Router, Request, Response } from 'express';
import * as sortingService from '../services/sorting.service';
import { ApiResponse } from '../types';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const record = sortingService.createSortingRecord(req.body);
    res.json({ success: true, data: record, message: '分选记录创建成功' } as ApiResponse<typeof record>);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message } as ApiResponse<null>);
  }
});

router.get('/', (req: Request, res: Response) => {
  const records = sortingService.getAllSortingRecords();
  res.json({ success: true, data: records } as ApiResponse<typeof records>);
});

router.get('/:id', (req: Request, res: Response) => {
  const record = sortingService.getSortingRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, error: '分选记录不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: record } as ApiResponse<typeof record>);
});

router.get('/batch/:batchId', (req: Request, res: Response) => {
  const record = sortingService.getSortingRecordByBatchId(req.params.batchId);
  if (!record) {
    return res.status(404).json({ success: false, error: '该批次尚无分选记录' } as ApiResponse<null>);
  }
  res.json({ success: true, data: record } as ApiResponse<typeof record>);
});

router.get('/materials/batch/:batchId', (req: Request, res: Response) => {
  const materials = sortingService.getSortedMaterialsByBatchId(req.params.batchId);
  res.json({ success: true, data: materials } as ApiResponse<typeof materials>);
});

router.get('/materials/:id', (req: Request, res: Response) => {
  const material = sortingService.getSortedMaterialById(req.params.id);
  if (!material) {
    return res.status(404).json({ success: false, error: '物料不存在' } as ApiResponse<null>);
  }
  res.json({ success: true, data: material } as ApiResponse<typeof material>);
});

export default router;
