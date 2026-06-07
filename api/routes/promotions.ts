
import { Router, type Request, type Response } from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotionStatus,
  addPromotionRemark,
} from '../services/promotionService.js';
import type { CreatePromotionRequest, PromotionStatus } from '../../shared/types.js';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const promotions = getAllPromotions();
    res.json(promotions);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ error: '获取促销陈列列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const promotion = getPromotionById(id);

    if (!promotion) {
      res.status(404).json({ error: '促销陈列不存在' });
      return;
    }

    res.json(promotion);
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({ error: '获取促销陈列详情失败' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreatePromotionRequest = req.body;
    const { specialistId, specialistName } = req.body;

    if (!data.title || !data.storeId || !data.deadline) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    const promotion = createPromotion(data, specialistId, specialistName);
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: '创建促销陈列失败' });
  }
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, userId, userName, userRole }: { status: PromotionStatus; userId?: string; userName?: string; userRole?: string } = req.body;

    const success = updatePromotionStatus(id, status, userId, userName, userRole);
    if (!success) {
      res.status(404).json({ error: '促销陈列不存在' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update promotion status error:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

router.post('/:id/remarks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, userName, userRole, content } = req.body;

    if (!content) {
      res.status(400).json({ error: '备注内容不能为空' });
      return;
    }

    const remark = addPromotionRemark(id, userId, userName, userRole, content);
    res.status(201).json(remark);
  } catch (error) {
    console.error('Add promotion remark error:', error);
    res.status(500).json({ error: '添加备注失败' });
  }
});

export default router;
