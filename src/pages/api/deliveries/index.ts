import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { Delivery, ApiResponse, DailyOrder } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Delivery[] | Delivery>>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { delivery_date, store_id, status, start_date, end_date } = req.query;
        let sql = `
          SELECT d.*, s.name as store_name, o.order_date, di.name as dish_name, di.specification
          FROM deliveries d
          LEFT JOIN stores s ON d.store_id = s.id
          LEFT JOIN daily_orders o ON d.order_id = o.id
          LEFT JOIN dishes di ON d.dish_id = di.id
          WHERE 1=1
        `;
        const params: any[] = [];
        
        if (delivery_date) {
          sql += ' AND d.delivery_date = ?';
          params.push(delivery_date);
        }
        
        if (start_date) {
          sql += ' AND d.delivery_date >= ?';
          params.push(start_date);
        }
        
        if (end_date) {
          sql += ' AND d.delivery_date <= ?';
          params.push(end_date);
        }
        
        if (store_id) {
          sql += ' AND d.store_id = ?';
          params.push(store_id);
        }
        
        if (status) {
          sql += ' AND d.status = ?';
          params.push(status);
        }
        
        sql += ' ORDER BY d.status ASC, d.created_at DESC';
        const deliveries = db.prepare(sql).all(...params) as (Delivery & { store_name?: string; order_date?: string; dish_name?: string; specification?: string })[];
        res.status(200).json({ success: true, data: deliveries });
        break;
      }
      
      case 'POST': {
        const { operator } = req.body;
        
        const completedOrders = db.prepare(`
          SELECT o.id, o.store_id, o.dish_id, o.quantity, o.order_date
          FROM daily_orders o
          WHERE o.status = 'production_completed'
          AND o.id NOT IN (SELECT order_id FROM deliveries)
        `).all() as DailyOrder[];
        
        if (completedOrders.length === 0) {
          return res.status(400).json({ success: false, error: '没有可配送的生产完成订单（订单需先完成生产）' });
        }
        
        const insertDelivery = db.prepare(`
          INSERT INTO deliveries 
          (delivery_date, store_id, order_id, dish_id, quantity, status, notes)
          VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `);
        
        const createdDeliveries: any[] = [];
        
        for (const order of completedOrders) {
          const result = insertDelivery.run(
            order.order_date,
            order.store_id,
            order.id,
            order.dish_id,
            order.quantity,
            `待发货，对应订单ID: ${order.id}`
          );
          
          const deliveryId = result.lastInsertRowid as number;
          
          const delivery = db.prepare(`
            SELECT d.*, s.name as store_name, o.order_date, di.name as dish_name
            FROM deliveries d
            LEFT JOIN stores s ON d.store_id = s.id
            LEFT JOIN daily_orders o ON d.order_id = o.id
            LEFT JOIN dishes di ON d.dish_id = di.id
            WHERE d.id = ?
          `).get(deliveryId);
          
          createdDeliveries.push(delivery);
          
          db.prepare(`UPDATE daily_orders SET status = 'ready_for_dispatch', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(order.id);
          
          logOperation(
            'create',
            'delivery',
            deliveryId,
            null,
            JSON.stringify(delivery),
            operator || 'system',
            `配送单生成（待发货），门店: ${(delivery as any).store_name}`
          );

          logOperation(
            'update',
            'daily_order',
            order.id,
            JSON.stringify({ status: 'production_completed' }),
            JSON.stringify({ status: 'ready_for_dispatch' }),
            operator || 'system',
            '配送单已生成，订单状态变更为待发货'
          );
        }
        
        res.status(201).json({ success: true, data: createdDeliveries as any, message: `成功生成 ${createdDeliveries.length} 条待发货配送单` });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
