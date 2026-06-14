import { Router } from 'express';
import { getDatabase, Handoff, Customer, DueDiligence } from '../database';

const router = Router();

router.get('/', async (req: any, res) => {
  try {
    const db = await getDatabase();
    const user = req.user;
    
    let handoffs;
    if (user.role === 'operation_manager') {
      handoffs = await db.all(`
        SELECT h.*, 
               u1.display_name as from_user_name,
               u2.display_name as to_user_name
        FROM handoffs h
        LEFT JOIN users u1 ON h.from_user = u1.id
        LEFT JOIN users u2 ON h.to_user = u2.id
        ORDER BY h.created_at DESC
      `) as (Handoff & { from_user_name: string; to_user_name: string })[];
    } else {
      handoffs = await db.all(`
        SELECT h.*, 
               u1.display_name as from_user_name,
               u2.display_name as to_user_name
        FROM handoffs h
        LEFT JOIN users u1 ON h.from_user = u1.id
        LEFT JOIN users u2 ON h.to_user = u2.id
        WHERE h.from_user = ? OR h.to_user = ?
        ORDER BY h.created_at DESC
      `, [user.id, user.id]) as (Handoff & { from_user_name: string; to_user_name: string })[];
    }

    for (const handoff of handoffs) {
      const tasks = await db.all(
        'SELECT * FROM handoff_tasks WHERE handoff_id = ?',
        [handoff.id]
      );
      (handoff as any).tasks = tasks;
    }

    res.json({ success: true, data: handoffs });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, from_user, to_user, tasks } = req.body;
    const db = await getDatabase();

    const result = await db.run(
      'INSERT INTO handoffs (type, from_user, to_user, status) VALUES (?, ?, ?, ?)',
      [type || 'shift', from_user, to_user, 'pending']
    );

    const handoffId = result.lastID;

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await db.run(
          'INSERT INTO handoff_tasks (handoff_id, task_type, task_id, task_description) VALUES (?, ?, ?, ?)',
          [handoffId, task.task_type, task.task_id, task.task_description]
        );
      }
    }

    res.json({ success: true, data: { id: handoffId } });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/pending', async (req: any, res) => {
  try {
    const db = await getDatabase();
    const user = req.user;

    let pendingCustomers, pendingDueDiligences;
    
    if (user.role === 'operation_manager') {
      pendingCustomers = await db.all(
        'SELECT * FROM customers WHERE status IN (?, ?)',
        ['pending', 'processing']
      ) as Customer[];

      pendingDueDiligences = await db.all(
        'SELECT * FROM due_diligences WHERE status IN (?, ?)',
        ['pending', 'processing']
      ) as DueDiligence[];
    } else {
      pendingCustomers = await db.all(
        'SELECT * FROM customers WHERE status IN (?, ?) AND assigned_to = ?',
        ['pending', 'processing', user.id]
      ) as Customer[];

      pendingDueDiligences = await db.all(
        'SELECT * FROM due_diligences WHERE status IN (?, ?) AND assigned_to = ?',
        ['pending', 'processing', user.id]
      ) as DueDiligence[];
    }

    const customerTasks = pendingCustomers.map((c: Customer) => ({
      task_type: 'customer',
      task_id: c.id,
      task_description: `客户${c.name}的${c.business_type}业务（状态：${c.status}）`
    }));

    const dueDiligenceTasks = pendingDueDiligences.map((d: DueDiligence) => ({
      task_type: 'due_diligence',
      task_id: d.id,
      task_description: `尽调补件任务 #${d.id}（状态：${d.status}）`
    }));

    res.json({
      success: true,
      data: {
        customers: customerTasks,
        dueDiligences: dueDiligenceTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const user = req.user;
    
    const handoff = await db.get<Handoff>(
      'SELECT * FROM handoffs WHERE id = ?',
      [id]
    );

    if (!handoff) {
      return res.status(404).json({ success: false, error: '交班记录不存在' });
    }

    if (user.role !== 'operation_manager' && handoff.from_user !== user.id && handoff.to_user !== user.id) {
      return res.status(403).json({ success: false, error: '无权访问此交班记录' });
    }

    const tasks = await db.all(
      'SELECT * FROM handoff_tasks WHERE handoff_id = ?',
      [id]
    );
    res.json({ 
      success: true, 
      data: { 
        ...handoff, 
        tasks 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.put('/:id/confirm', async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const user = req.user;

    const handoff = await db.get(
      'SELECT * FROM handoffs WHERE id = ?',
      [id]
    ) as Handoff;

    if (!handoff) {
      return res.status(404).json({ success: false, error: '交班记录不存在' });
    }

    if (user.role !== 'operation_manager' && handoff.to_user !== user.id) {
      return res.status(403).json({ success: false, error: '只有接班人可以确认接收交班' });
    }

    const tasks = await db.all(
      'SELECT * FROM handoff_tasks WHERE handoff_id = ?',
      [id]
    );

    for (const task of tasks) {
      if (task.task_type === 'customer') {
        await db.run(
          'UPDATE customers SET assigned_to = ?, status = ? WHERE id = ?',
          [handoff.to_user, 'processing', task.task_id]
        );
      } else if (task.task_type === 'due_diligence') {
        await db.run(
          'UPDATE due_diligences SET assigned_to = ?, status = ? WHERE id = ?',
          [handoff.to_user, 'processing', task.task_id]
        );
      }
    }

    await db.run(
      'UPDATE handoffs SET status = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['confirmed', id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

export default router;
