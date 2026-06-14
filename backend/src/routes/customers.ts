import { Router } from 'express';
import { getDatabase, Customer, addNotification } from '../database';

const router = Router();

router.get('/', async (req: any, res) => {
  try {
    const db = await getDatabase();
    const user = req.user;
    
    let customers;
    if (user.role === 'lobby_manager') {
      customers = await db.all<Customer>(`
        SELECT c.*, 
               u1.display_name as assigned_to_name,
               u2.display_name as created_by_name
        FROM customers c
        LEFT JOIN users u1 ON c.assigned_to = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        WHERE c.created_by = ?
        ORDER BY c.created_at DESC
      `, [user.id]);
    } else if (user.role === 'account_manager') {
      customers = await db.all<Customer>(`
        SELECT c.*, 
               u1.display_name as assigned_to_name,
               u2.display_name as created_by_name
        FROM customers c
        LEFT JOIN users u1 ON c.assigned_to = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        WHERE c.assigned_to = ?
        ORDER BY c.created_at DESC
      `, [user.id]);
    } else {
      customers = await db.all<Customer>(`
        SELECT c.*, 
               u1.display_name as assigned_to_name,
               u2.display_name as created_by_name
        FROM customers c
        LEFT JOIN users u1 ON c.assigned_to = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        ORDER BY c.created_at DESC
      `);
    }
    
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, business_type, urgency, assigned_to, created_by } = req.body;
    const db = await getDatabase();
    
    const result = await db.run(
      'INSERT INTO customers (name, phone, business_type, urgency, status, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, business_type, urgency || 'normal', 'pending', assigned_to, created_by]
    );

    const customerId = result.lastID;

    const docTypes = ['身份证', '营业执照', '财务报表', '授权委托书'];
    for (const docType of docTypes) {
      await db.run(
        'INSERT INTO customer_documents (customer_id, document_type, status) VALUES (?, ?, ?)',
        [customerId, docType, 'pending']
      );
    }

    if (assigned_to) {
      await addNotification(
        assigned_to,
        'customer',
        '新客户登记',
        `新客户${name}已登记，需处理${business_type}业务`
      );
    }

    res.json({ success: true, data: { id: customerId } });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const customer = await db.get<Customer & { assigned_to_name: string; created_by_name: string }>(
      `SELECT c.*, 
              u1.display_name as assigned_to_name,
              u2.display_name as created_by_name
       FROM customers c
       LEFT JOIN users u1 ON c.assigned_to = u1.id
       LEFT JOIN users u2 ON c.created_by = u2.id
       WHERE c.id = ?`,
      [id]
    );

    if (customer) {
      res.json({ success: true, data: customer });
    } else {
      res.status(404).json({ success: false, error: '客户不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, business_type, urgency, status, assigned_to } = req.body;
    const db = await getDatabase();

    await db.run(
      'UPDATE customers SET name = ?, phone = ?, business_type = ?, urgency = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, business_type, urgency, status, assigned_to, id]
    );

    if (status === 'completed') {
      const customer = await db.get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
      if (customer) {
        const dueDiligenceCount = await db.get<{ count: number }>(
          'SELECT COUNT(*) as count FROM due_diligences WHERE customer_id = ?',
          [id]
        );

        if (dueDiligenceCount && dueDiligenceCount.count === 0) {
          const documents = await db.all(
            'SELECT * FROM customer_documents WHERE customer_id = ?',
            [id]
          );
          
          let inheritedNotes = `来自客户资料处理备注：\n`;
          for (const doc of documents) {
            inheritedNotes += `- ${doc.document_type}: ${doc.notes || '无备注'}\n`;
          }
          inheritedNotes += `\n客户${customer.name}的${customer.business_type}业务已完成初步审核，需进一步核实。`;

          await db.run(
            'INSERT INTO due_diligences (customer_id, source_customer_id, inherited_notes, status, assigned_to) VALUES (?, ?, ?, ?, ?)',
            [id, id, inheritedNotes, 'pending', assigned_to]
          );

          if (assigned_to) {
            await addNotification(
              assigned_to,
              'due_diligence',
              '尽调补件任务',
              `客户${customer.name}的资料已审核通过，需进行尽调补件`
            );
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.get('/:customerId/documents', async (req, res) => {
  try {
    const { customerId } = req.params;
    const db = await getDatabase();
    const documents = await db.all(
      'SELECT * FROM customer_documents WHERE customer_id = ?',
      [customerId]
    );
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.post('/:customerId/documents', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { document_type, file_name, file_size, file_type, status, notes } = req.body;
    const db = await getDatabase();

    const result = await db.run(
      'INSERT INTO customer_documents (customer_id, document_type, file_name, file_size, file_type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customerId, document_type, file_name, file_size, file_type, status, notes]
    );

    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

export default router;
