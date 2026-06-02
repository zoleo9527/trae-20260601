import { Router } from 'express';
import { groupPointService } from '../services/groupPointService.js';
import { z } from 'zod';

const router = Router();

const createGroupPointSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  leaderName: z.string().min(1),
  leaderPhone: z.string().min(11),
  leaderIdCard: z.string().optional(),
  commissionRate: z.number().int().min(0).max(10000).optional(),
});

const updateLeaderSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  commissionRate: z.number().int().min(0).max(10000).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
});

// 创建团点
router.post('/group-points', async (req, res) => {
  try {
    const dto = createGroupPointSchema.parse(req.body);
    const result = await groupPointService.createGroupPoint(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取团点列表
router.get('/group-points', async (_req, res) => {
  const result = await groupPointService.listGroupPoints();
  res.json({ success: true, data: result });
});

// 获取单个团点
router.get('/group-points/:id', async (req, res) => {
  const result = await groupPointService.getGroupPoint(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '团点不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 更新团长信息
router.put('/leaders/:id', async (req, res) => {
  try {
    const dto = updateLeaderSchema.parse(req.body);
    const result = await groupPointService.updateLeader(req.params.id, dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取团长列表
router.get('/leaders', async (_req, res) => {
  const result = await groupPointService.listLeaders();
  res.json({ success: true, data: result });
});

// 获取单个团长
router.get('/leaders/:id', async (req, res) => {
  const result = await groupPointService.getLeader(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '团长不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

export default router;
