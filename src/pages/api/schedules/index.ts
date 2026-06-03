import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { ProductionSchedule, ApiResponse } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ProductionSchedule[] | ProductionSchedule>>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { schedule_date, status } = req.query;
        let sql = `
          SELECT ps.*, d.name as dish_name, d.category as dish_category
          FROM production_schedules ps
          LEFT JOIN dishes d ON ps.dish_id = d.id
          WHERE 1=1
        `;
        const params: any[] = [];
        
        if (schedule_date) {
          sql += ' AND ps.schedule_date = ?';
          params.push(schedule_date);
        }
        
        if (status) {
          sql += ' AND ps.status = ?';
          params.push(status);
        }
        
        sql += ' ORDER BY ps.created_at DESC';
        const schedules = db.prepare(sql).all(...params) as ProductionSchedule[];
        res.status(200).json({ success: true, data: schedules });
        break;
      }
      
      case 'POST': {
        const { schedule_date, operator } = req.body;
        
        if (!schedule_date) {
          return res.status(400).json({ success: false, error: '排程日期不能为空' });
        }
        
        const orderSummary = db.prepare(`
          SELECT dish_id, SUM(quantity) as total_quantity
          FROM daily_orders
          WHERE order_date = ? AND status != 'cancelled'
          GROUP BY dish_id
        `).all(schedule_date) as { dish_id: number; total_quantity: number }[];
        
        if (orderSummary.length === 0) {
          return res.status(400).json({ success: false, error: '该日期暂无报单数据' });
        }
        
        const pendingOrders = db.prepare(`
          SELECT id FROM daily_orders 
          WHERE order_date = ? AND status = 'pending'
        `).all(schedule_date) as any[];
        
        db.prepare(`
          UPDATE daily_orders 
          SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
          WHERE order_date = ? AND status = 'pending'
        `).run(schedule_date);
        
        for (const order of pendingOrders) {
          logOperation(
            'update',
            'daily_order',
            order.id,
            JSON.stringify({ status: 'pending' }),
            JSON.stringify({ status: 'confirmed' }),
            operator || 'system',
            '排程生成，订单自动确认'
          );
        }
        
        const insertSchedule = db.prepare(
          `INSERT INTO production_schedules (schedule_date, dish_id, total_quantity, status, notes)
           VALUES (?, ?, ?, 'scheduled', ?)
           ON CONFLICT(schedule_date, dish_id) DO UPDATE SET
             total_quantity = excluded.total_quantity,
             updated_at = CURRENT_TIMESTAMP`
        );
        
        const createdSchedules: ProductionSchedule[] = [];
        for (const item of orderSummary) {
          insertSchedule.run(schedule_date, item.dish_id, item.total_quantity, '根据报单自动生成');
          const schedule = db.prepare(`
            SELECT ps.*, d.name as dish_name, d.category as dish_category
            FROM production_schedules ps
            LEFT JOIN dishes d ON ps.dish_id = d.id
            WHERE ps.schedule_date = ? AND ps.dish_id = ?
          `).get(schedule_date, item.dish_id) as ProductionSchedule;
          createdSchedules.push(schedule);
        }
        
        logOperation('create', 'production_schedule', 0, null, JSON.stringify(createdSchedules), operator || 'system', `生成${schedule_date}排程`);
        
        res.status(201).json({ success: true, data: createdSchedules as any });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
