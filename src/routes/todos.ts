import { Router } from 'express';
import { todoService, beverageStorageService } from '../services/index.js';
import type { StaffRole } from '../models/types.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const role = req.query.role as StaffRole;
    const status = req.query.status as string;

    if (!role) {
      return res.status(400).json({ error: '缺少角色参数' });
    }

    const todos = todoService.getTodosByRole(role, status);
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: '获取待办列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const details = todoService.getTodoDetails(req.params.id);
    res.json(details);
  } catch (error: any) {
    if (error.message === '待办事项不存在') {
      return res.status(404).json({ error: '待办事项不存在' });
    }
    console.error('Error fetching todo details:', error);
    res.status(500).json({ error: '获取待办详情失败' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const result = todoService.updateTodoStatus(req.params.id, status);
    if (!result) {
      return res.status(404).json({ error: '待办事项不存在' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating todo status:', error);
    res.status(500).json({ error: '更新待办状态失败' });
  }
});

export default router;
