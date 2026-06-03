import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { ApiResponse } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    switch (req.method) {
      case 'PUT': {
        const { ids, status, operator } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ success: false, error: '请选择要处理的配送单' });
        }
        
        if (!status) {
          return res.status(400).json({ success: false, error: '请指定状态' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        const existingDeliveries = db.prepare(`SELECT * FROM deliveries WHERE id IN (${placeholders})`).all(...ids);
        
        let sql = 'UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP';
        const params: any[] = [status];
        
        if (status === 'dispatched') {
          sql += ', dispatched_at = CURRENT_TIMESTAMP';
        }
        
        sql += ` WHERE id IN (${placeholders})`;
        params.push(...ids);
        
        db.prepare(sql).run(...params);
        
        const updatedDeliveries = db.prepare(`
          SELECT d.*, s.name as store_name, di.name as dish_name
          FROM deliveries d
          LEFT JOIN stores s ON d.store_id = s.id
          LEFT JOIN dishes di ON d.dish_id = di.id
          WHERE d.id IN (${placeholders})
        `).all(...ids);
        
        logOperation(
          'batch_update',
          'delivery',
          0,
          JSON.stringify(existingDeliveries),
          JSON.stringify(updatedDeliveries),
          operator || 'system',
          `批量更新状态为: ${status}，共 ${ids.length} 条`
        );
        
        if (status === 'dispatched') {
          for (const delivery of existingDeliveries as any[]) {
            db.prepare(`UPDATE daily_orders SET status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
              .run(delivery.order_id);
          }
        }
        
        res.status(200).json({ success: true, data: updatedDeliveries, message: `成功处理 ${ids.length} 条配送单` });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
