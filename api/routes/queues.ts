import express from 'express';
import { queueService } from '../services/queueService';
import { logService } from '../services/logService';
import { userService } from '../services/userService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const queues = queueService.getAllQueues();
    res.json(queues);
  } catch (error) {
    res.status(500).json({ message: '获取排号列表失败', error });
  }
});

router.get('/:id', (req, res) => {
  try {
    const queue = queueService.getQueueById(req.params.id);
    if (!queue) {
      return res.status(404).json({ message: '排号不存在' });
    }
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: '获取排号详情失败', error });
  }
});

router.post('/', (req, res) => {
  try {
    const { customerName, phone, partySize, submittedBy } = req.body;
    const queue = queueService.createQueue(customerName, phone, partySize, submittedBy);

    const user = userService.getUserById(submittedBy);
    logService.createLog(
      submittedBy,
      user?.name || '',
      '创建排号',
      '排号',
      queue.id,
      `顾客: ${customerName}, 人数: ${partySize}`
    );

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: '创建排号失败', error });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, operatedBy } = req.body;
    const queue = queueService.updateQueueStatus(req.params.id, status);

    if (!queue) {
      return res.status(404).json({ message: '排号不存在' });
    }

    const user = userService.getUserById(operatedBy);
    const statusMap: Record<string, string> = {
      waiting: '等待中',
      seated: '已入座',
      completed: '已完成',
      cancelled: '已取消',
    };
    logService.createLog(
      operatedBy,
      user?.name || '',
      '更新排号状态',
      '排号',
      queue.id,
      `状态: ${statusMap[status]}`
    );

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: '更新排号失败', error });
  }
});

router.post('/:id/assign', (req, res) => {
  try {
    const { tableId, assignedBy } = req.body;
    const queue = queueService.assignTable(req.params.id, tableId);

    if (!queue) {
      return res.status(404).json({ message: '排号不存在' });
    }

    const user = userService.getUserById(assignedBy);
    logService.createLog(
      assignedBy,
      user?.name || '',
      '分配桌台',
      '排号',
      queue.id,
      `桌台: ${queue.assignedTableName}`
    );

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: '分配桌台失败', error });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const success = queueService.deleteQueue(req.params.id);
    if (!success) {
      return res.status(404).json({ message: '排号不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除排号失败', error });
  }
});

export default router;
