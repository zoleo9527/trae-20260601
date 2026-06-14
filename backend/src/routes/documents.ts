import { Router } from 'express';
import { getDatabase, CustomerDocument } from '../database';

const router = Router();

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { document_type, file_name, file_size, file_type, status, notes } = req.body;
    const db = await getDatabase();

    await db.run(
      'UPDATE customer_documents SET document_type = ?, file_name = ?, file_size = ?, file_type = ?, status = ?, notes = ? WHERE id = ?',
      [document_type, file_name, file_size, file_type, status, notes, id]
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
