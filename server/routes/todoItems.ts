import { Router } from 'express';
import { TodoItem } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const { assigneeRole, completed } = req.query;
  const whereClause: Record<string, unknown> = {};
  
  if (assigneeRole) {
    whereClause.assigneeRole = assigneeRole;
  }
  if (completed !== undefined) {
    whereClause.completed = completed === 'true';
  }

  const todos = await TodoItem.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });
  res.json(todos);
});

router.get('/:id', async (req, res) => {
  const todo = await TodoItem.findByPk(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }
  res.json(todo);
});

router.put('/:id/complete', async (req, res) => {
  const todo = await TodoItem.findByPk(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }

  await todo.update({ completed: true, completedAt: new Date() });
  res.json(todo);
});

router.delete('/:id', async (req, res) => {
  const todo = await TodoItem.findByPk(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }

  await todo.destroy();
  res.status(204).end();
});

export default router;
