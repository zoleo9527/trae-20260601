import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { OperationLog, ApiResponse } from '@/types';

initDb();

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<OperationLog[]>>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { entity_type, entity_id, start_date, end_date, limit = 100, offset = 0 } = req.query;
        let sql = 'SELECT * FROM operation_logs WHERE 1=1';
        const params: any[] = [];
        
        if (entity_type) {
          sql += ' AND entity_type = ?';
          params.push(entity_type);
        }
        
        if (entity_id) {
          sql += ' AND entity_id = ?';
          params.push(entity_id);
        }
        
        if (start_date) {
          sql += ' AND timestamp >= ?';
          params.push(start_date);
        }
        
        if (end_date) {
          sql += ' AND timestamp <= ?';
          params.push(end_date + ' 23:59:59');
        }
        
        sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const logs = db.prepare(sql).all(...params) as OperationLog[];
        res.status(200).json({ success: true, data: logs });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
