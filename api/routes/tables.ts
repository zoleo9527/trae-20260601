import express from 'express';
import { tableService } from '../services/tableService';
import { logService } from '../services/logService';
import { userService } from '../services/userService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const tables = tableService.getAllTables();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: '获取桌台列表失败', error });
  }
});

router.get('/:id', (req, res) => {
  try {
    const table = tableService.getTableById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: '桌台不存在' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: '获取桌台详情失败', error });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, capacity, position, createdBy } = req.body;
    const table = tableService.createTable(name, capacity, position);

    const user = userService.getUserById(createdBy);
    logService.createLog(
      createdBy,
      user?.name || '',
      '创建桌台',
      '桌台',
      table.id,
      `桌台: ${name}, 容量: ${capacity}`
    );

    res.json(table);
  } catch (error) {
    res.status(500).json({ message: '创建桌台失败', error });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, name, capacity, position, operatedBy } = req.body;
    
    let table;
    if (status) {
      table = tableService.updateTableStatus(req.params.id, status);
    } else {
      table = tableService.updateTable(req.params.id, name, capacity, position);
    }

    if (!table) {
      return res.status(404).json({ message: '桌台不存在' });
    }

    const user = userService.getUserById(operatedBy);
    const action = status ? '更新桌台状态' : '更新桌台信息';
    const details = status ? `状态: ${status}` : `名称: ${name}, 容量: ${capacity}, 位置: ${position}`;
    logService.createLog(
      operatedBy,
      user?.name || '',
      action,
      '桌台',
      table.id,
      details
    );

    res.json(table);
  } catch (error) {
    res.status(500).json({ message: '更新桌台失败', error });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const success = tableService.deleteTable(req.params.id);
    if (!success) {
      return res.status(404).json({ message: '桌台不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除桌台失败', error });
  }
});

export default router;
