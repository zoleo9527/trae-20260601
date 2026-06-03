import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { DailyOrder, ApiResponse } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<DailyOrder[] | DailyOrder>>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { order_date, store_id, status, is_urgent } = req.query;
        let sql = `
          SELECT o.*, s.name as store_name, d.name as dish_name, d.allergens as dish_allergens
          FROM daily_orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN dishes d ON o.dish_id = d.id
          WHERE 1=1
        `;
        const params: any[] = [];
        
        if (order_date) {
          sql += ' AND o.order_date = ?';
          params.push(order_date);
        }
        
        if (store_id) {
          sql += ' AND o.store_id = ?';
          params.push(store_id);
        }
        
        if (status) {
          sql += ' AND o.status = ?';
          params.push(status);
        }
        
        if (is_urgent !== undefined) {
          sql += ' AND o.is_urgent = ?';
          params.push(is_urgent === 'true' ? 1 : 0);
        }
        
        sql += ' ORDER BY o.is_urgent DESC, o.created_at DESC';
        const orders = db.prepare(sql).all(...params) as DailyOrder[];
        res.status(200).json({ success: true, data: orders });
        break;
      }
      
      case 'POST': {
        const { order_date, store_id, dish_id, quantity, is_urgent, allergens_confirmation, special_instructions, created_by } = req.body;
        
        if (!order_date || !store_id || !dish_id || !quantity || !created_by) {
          return res.status(400).json({ success: false, error: '缺少必要参数' });
        }
        
        if (!allergens_confirmation) {
          return res.status(400).json({ success: false, error: '请确认过敏原信息' });
        }
        
        const dish = db.prepare('SELECT allergens FROM dishes WHERE id = ?').get(dish_id);
        if (!dish) {
          return res.status(404).json({ success: false, error: '菜品不存在' });
        }
        
        const result = db.prepare(
          `INSERT INTO daily_orders 
           (order_date, store_id, dish_id, quantity, is_urgent, allergens_confirmation, special_instructions, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
        ).run(order_date, store_id, dish_id, quantity, is_urgent ? 1 : 0, allergens_confirmation, special_instructions || '', created_by);
        
        const orderId = result.lastInsertRowid as number;
        const newOrder = db.prepare(`
          SELECT o.*, s.name as store_name, d.name as dish_name, d.allergens as dish_allergens
          FROM daily_orders o
          LEFT JOIN stores s ON o.store_id = s.id
          LEFT JOIN dishes d ON o.dish_id = d.id
          WHERE o.id = ?
        `).get(orderId) as DailyOrder;
        
        logOperation('create', 'daily_order', orderId, null, JSON.stringify(newOrder), created_by, is_urgent ? '临时加单' : '常规报单');
        
        res.status(201).json({ success: true, data: newOrder });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, error: '该门店今日已报过此菜品，请修改数量' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
