import express, { type Request, type Response } from 'express';
import { getPackagingBatches, getPackagingBatchById, submitInspection, updateInspection } from '../services/packagingService.js';

const router = express.Router();

router.get('/batches', (req: Request, res: Response): void => {
  try {
    const { status } = req.query;
    const batches = getPackagingBatches(status as string);
    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取包装批次列表失败',
    });
  }
});

router.get('/batches/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const batch = getPackagingBatchById(id);
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

router.post('/batches/:id/inspect', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { qualifiedQty, damagedQty, damageReasons, remark, inspector } = req.body;

    if (qualifiedQty === undefined || damagedQty === undefined) {
      res.status(400).json({
        success: false,
        message: '合格数量和破损数量不能为空',
      });
      return;
    }

    const result = submitInspection(id, {
      qualifiedQty,
      damagedQty,
      damageReasons: damageReasons || [],
      remark,
      inspector: inspector || '赵质检',
    });

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
      message: '质检提交成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交质检失败',
    });
  }
});

router.put('/inspections/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { qualifiedQty, damagedQty, damageReasons, remark, inspector } = req.body;

    if (qualifiedQty === undefined || damagedQty === undefined) {
      res.status(400).json({
        success: false,
        message: '合格数量和破损数量不能为空',
      });
      return;
    }

    const result = updateInspection(id, {
      qualifiedQty,
      damagedQty,
      damageReasons: damageReasons || [],
      remark,
      inspector: inspector || '赵质检',
    });

    if (!result) {
      res.status(404).json({
        success: false,
        message: '批次不存在或尚未质检',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: '质检更新成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新质检失败',
    });
  }
});

export default router;
