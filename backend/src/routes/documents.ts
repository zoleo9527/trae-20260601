import { Router } from 'express';
import { getDatabase, CustomerDocument } from '../database';

const router = Router();

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { document_type, file_name, file_size, file_type, status, notes } = req.body;
    const db = await getDatabase();

    const updates: string[] = [];
    const params: any[] = [];

    if (document_type !== undefined) {
      updates.push('document_type = ?');
      params.push(document_type);
    }
    if (file_name !== undefined) {
      updates.push('file_name = ?');
      params.push(file_name);
    }
    if (file_size !== undefined) {
      updates.push('file_size = ?');
      params.push(file_size);
    }
    if (file_type !== undefined) {
      updates.push('file_type = ?');
      params.push(file_type);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.json({ success: true });
    }

    await db.run(
      `UPDATE customer_documents SET ${updates.join(', ')} WHERE id = ?`,
      [...params, id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM customer_documents WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

export default router;
