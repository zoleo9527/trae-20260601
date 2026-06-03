import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { DailyOrder, ApiResponse } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string | null, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<DailyOrder>>
) {
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case 'GET': {
        const order = db.prepare(`
          SELECT o.*, s.name as store_name, d.name as dish_name, d.allergens as dish_allergens
          FROM daily_orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN dishes d ON o.dish_id = d.id
          WHERE o.id = ?
        `).get(id) as DailyOrder;
        
        if (!order) {
          return res.status(404).json({ success: false, error: '报单不存在' });
        }
        
        res.status(200).json({ success: true, data: order });
        break;
      }
      
      case 'PUT': {
        const { quantity, special_instructions, status, operator } = req.body;
        
        const existingOrder = db.prepare('SELECT * FROM daily_orders WHERE id = ?').get(id);
        if (!existingOrder) {
          return res.status(404).json({ success: false, error: '报单不存在' });
        }
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (quantity !== undefined) {
          updates.push('quantity = ?');
          params.push(quantity);
        }
        
        if (special_instructions !== undefined) {
          updates.push('special_instructions = ?');
          params.push(special_instructions);
        }
        
        if (status !== undefined) {
          updates.push('status = ?');
          params.push(status);
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: '没有需要更新的字段' });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        
        db.prepare(`UPDATE daily_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const updatedOrder = db.prepare(`
          SELECT o.*, s.name as store_name, d.name as dish_name, d.allergens as dish_allergens
          FROM daily_orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN dishes d ON o.dish_id = d.id
          WHERE o.id = ?
        `).get(id) as DailyOrder;
        
        logOperation('update', 'daily_order', Number(id), JSON.stringify(existingOrder), JSON.stringify(updatedOrder), operator || 'system');
        
        res.status(200).json({ success: true, data: updatedOrder });
        break;
      }
      
      case 'DELETE': {
        const { operator } = req.body;
        
        const existingOrder = db.prepare('SELECT * FROM daily_orders WHERE id = ?').get(id);
        if (!existingOrder) {
          return res.status(404).json({ success: false, error: '报单不存在' });
        }
        
        db.prepare('DELETE FROM daily_orders WHERE id = ?').run(id);
        logOperation('delete', 'daily_order', Number(id), JSON.stringify(existingOrder), null, operator || 'system');
        
        res.status(200).json({ success: true, message: '删除成功' });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
