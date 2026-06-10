import express, { type Request, type Response } from 'express';
import { getLoadingBatches, getLoadingBatchById, confirmLoading } from '../services/loadingService.js';

const router = express.Router();

router.get('/batches', (req: Request, res: Response): void => {
  try {
    const { status } = req.query;
    const batches = getLoadingBatches(status as string);
    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取装车批次列表失败',
    });
  }
});

router.get('/batches/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const batch = getLoadingBatchById(id);
    if (!batch) {
      res.status(404).json({
        success: false,
        message: '批次不存在',
      });
      return;
    }
    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取批次详情失败',
    });
  }
});

router.post('/batches/:id/confirm', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { confirmer, confirmed } = req.body;

    const result = confirmLoading(id, confirmer || '钱主管', confirmed !== false);

    if (!result) {
      res.status(404).json({
        success: false,
        message: '批次不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: confirmed !== false ? '装车复核确认成功' : '装车复核已退回',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
    });
  }
});

export default router;
