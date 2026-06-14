import { Router } from 'express';
import { getDatabase, DueDiligence, addNotification } from '../database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const dueDiligences = await db.all<DueDiligence & { customer_name: string; assigned_to_name: string }>(`
      SELECT d.*, 
             c.name as customer_name,
             u.display_name as assigned_to_name
      FROM due_diligences d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u ON d.assigned_to = u.id
      ORDER BY d.created_at DESC
    `);
    res.json({ success: true, data: dueDiligences });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer_id, source_customer_id, inherited_notes, assigned_to } = req.body;
    const db = await getDatabase();

    const result = await db.run(
      'INSERT INTO due_diligences (customer_id, source_customer_id, inherited_notes, status, assigned_to) VALUES (?, ?, ?, ?, ?)',
      [customer_id, source_customer_id, inherited_notes, 'pending', assigned_to]
    );

    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const dueDiligence = await db.get<DueDiligence & { customer_name: string; assigned_to_name: string }>(
      `SELECT d.*, 
              c.name as customer_name,
              u.display_name as assigned_to_name
       FROM due_diligences d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (dueDiligence) {
      const attachments = await db.all(
        'SELECT * FROM due_diligence_attachments WHERE due_diligence_id = ?',
        [id]
      );
      res.json({ 
        success: true, 
        data: { 
          ...dueDiligence, 
          attachments 
        } 
      });
    } else {
      res.status(404).json({ success: false, error: '尽调补件不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { inherited_notes, status, assigned_to } = req.body;
    const db = await getDatabase();

    await db.run(
      'UPDATE due_diligences SET inherited_notes = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [inherited_notes, status, assigned_to, id]
    );

    if (status === 'completed') {
      const dueDiligence = await db.get<DueDiligence>('SELECT * FROM due_diligences WHERE id = ?', [id]);
      if (dueDiligence) {
        await db.run(
          'UPDATE customers SET status = ? WHERE id = ?',
          ['completed', dueDiligence.customer_id]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_size, file_type, notes } = req.body;
    const db = await getDatabase();

    const result = await db.run(
      'INSERT INTO due_diligence_attachments (due_diligence_id, file_name, file_size, file_type, notes) VALUES (?, ?, ?, ?, ?)',
      [id, file_name, file_size, file_type, notes]
    );

    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    const dueDiligence = await db.get<DueDiligence>(
      'SELECT * FROM due_diligences WHERE id = ?',
      [id]
    );

    if (!dueDiligence) {
      return res.status(404).json({ success: false, error: '尽调补件不存在' });
    }

    const customerId = dueDiligence.source_customer_id || dueDiligence.customer_id;
    
    const customer = await db.get(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    const documents = await db.all(
      'SELECT * FROM customer_documents WHERE customer_id = ?',
      [customerId]
    );

    const attachments = await db.all(
      'SELECT * FROM due_diligence_attachments WHERE due_diligence_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        customer,
        documents,
        dueDiligence,
        attachments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

export default router;
