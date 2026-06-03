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
          return res.status(400).json({ success: false, error: '请选择要处理的报单' });
        }
        
        if (!status) {
          return res.status(400).json({ success: false, error: '请指定状态' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        const existingOrders = db.prepare(`SELECT * FROM daily_orders WHERE id IN (${placeholders})`).all(...ids);
        
        db.prepare(`UPDATE daily_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`)
          .run(status, ...ids);
        
        const updatedOrders = db.prepare(`
          SELECT o.*, s.name as store_name, d.name as dish_name
          FROM daily_orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN dishes d ON o.dish_id = d.id
          WHERE o.id IN (${placeholders})
        `).all(...ids);
        
        logOperation(
          'batch_update',
          'daily_order',
          0,
          JSON.stringify(existingOrders),
          JSON.stringify(updatedOrders),
          operator || 'system',
          `批量更新状态为: ${status}`
        );
        
        res.status(200).json({ success: true, data: updatedOrders, message: `成功处理 ${ids.length} 条报单` });
        break;
      }
      
      case 'POST': {
        const { order_date, store_id, items, created_by } = req.body;
        
        if (!order_date || !store_id || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }
        
        const createdOrders: any[] = [];
        const stmt = db.prepare(
          `INSERT INTO daily_orders 
           (order_date, store_id, dish_id, quantity, is_urgent, allergens_confirmation, special_instructions, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
        );
        
        for (const item of items) {
          if (!item.allergens_confirmation) {
            return res.status(400).json({ success: false, error: `菜品 ${item.dish_id} 未确认过敏原信息` });
          }
          
          const result = stmt.run(
            order_date,
            store_id,
            item.dish_id,
            item.quantity,
            item.is_urgent ? 1 : 0,
            item.allergens_confirmation,
            item.special_instructions || '',
            created_by
          );
          
          const order = db.prepare(`
            SELECT o.*, s.name as store_name, d.name as dish_name, d.allergens as dish_allergens
            FROM daily_orders o
            LEFT JOIN stores s ON o.store_id = s.id
            LEFT JOIN dishes d ON o.dish_id = d.id
            WHERE o.id = ?
          `).get(result.lastInsertRowid);
          
          createdOrders.push(order);
        }
        
        logOperation(
          'batch_create',
          'daily_order',
          0,
          null,
          JSON.stringify(createdOrders),
          created_by,
          `批量创建报单，共 ${items.length} 条`
        );
        
        res.status(201).json({ success: true, data: createdOrders });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, error: '存在重复的报单，请检查后重试' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
