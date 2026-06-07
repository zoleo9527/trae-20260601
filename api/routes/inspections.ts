
import { Router, type Request, type Response } from 'express';
import {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspectionStatus,
  replyInspection,
  addInspectionRemark,
} from '../services/inspectionService.js';
import type { CreateInspectionRequest, InspectionStatus, ReplyInspectionRequest } from '../../shared/types.js';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const inspections = getAllInspections();
    res.json(inspections);
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ error: '获取巡店整改列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inspection = getInspectionById(id);

    if (!inspection) {
      res.status(404).json({ error: '巡店整改不存在' });
      return;
    }

    res.json(inspection);
  } catch (error) {
    console.error('Get inspection error:', error);
    res.status(500).json({ error: '获取巡店整改详情失败' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreateInspectionRequest = req.body;
    const { supervisorId, supervisorName } = req.body;

    if (!data.title || !data.storeId || !data.description || !data.requirement || !data.deadline) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    const inspection = createInspection(data, supervisorId, supervisorName);
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({ error: '创建巡店整改失败' });
  }
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectReason, userId, userName, userRole }: { status: InspectionStatus; rejectReason?: string; userId?: string; userName?: string; userRole?: string } = req.body;

    const success = updateInspectionStatus(id, status, rejectReason, userId, userName, userRole);
    if (!success) {
      res.status(404).json({ error: '巡店整改不存在' });
      return;
    }

    res.json({ success: true, rejected: status === 'rejected' });
  } catch (error) {
    console.error('Update inspection status error:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

router.post('/:id/reply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data: ReplyInspectionRequest = req.body;
    const { userId, userName, userRole } = req.body;

    if (!data.content) {
      res.status(400).json({ error: '整改回复内容不能为空' });
      return;
    }

    const success = replyInspection(id, data.content, userId, userName, userRole);
    if (!success) {
      res.status(404).json({ error: '巡店整改不存在' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reply inspection error:', error);
    res.status(500).json({ error: '提交整改回复失败' });
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

    const remark = addInspectionRemark(id, userId, userName, userRole, content);
    res.status(201).json(remark);
  } catch (error) {
    console.error('Add inspection remark error:', error);
    res.status(500).json({ error: '添加备注失败' });
  }
});

export default router;
