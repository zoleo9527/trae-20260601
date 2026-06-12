import { Router, Request, Response } from 'express';
import db from '../database.ts';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.query;

    let whereClause = '1=1';
    const values: any[] = [];

    if (entityType) {
      whereClause += ' AND entity_type = ?';
      values.push(entityType);
    }
    if (entityId) {
      whereClause += ' AND entity_id = ?';
      values.push(entityId);
    }

    const rows = db.prepare(`
      SELECT * FROM status_histories 
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `).all(...values);

    const history = rows.map((row: any) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      changedBy: row.changed_by,
      reason: row.reason,
      createdAt: row.created_at,
    }));

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

export default router;
