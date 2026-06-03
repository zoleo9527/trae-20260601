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
  res: NextApiResponse<ApiResponse<ProductionSchedule>>
) {
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case 'GET': {
        const schedule = db.prepare(`
          SELECT ps.*, d.name as dish_name, d.category as dish_category
          FROM production_schedules ps
          LEFT JOIN dishes d ON ps.dish_id = d.id
          WHERE ps.id = ?
        `).get(id) as ProductionSchedule;
        
        if (!schedule) {
          return res.status(404).json({ success: false, error: '排程不存在' });
        }
        
        res.status(200).json({ success: true, data: schedule });
        break;
      }
      
      case 'PUT': {
        const { status, start_time, end_time, assigned_to, notes, operator } = req.body;
        
        const existingSchedule = db.prepare('SELECT * FROM production_schedules WHERE id = ?').get(id);
        if (!existingSchedule) {
          return res.status(404).json({ success: false, error: '排程不存在' });
        }
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (status !== undefined) {
          updates.push('status = ?');
          params.push(status);
          
          const oldStatus = (existingSchedule as any).status;
          
          if (status === 'in_production' && oldStatus === 'scheduled') {
            db.prepare(`
              UPDATE daily_orders 
              SET status = 'in_production', updated_at = CURRENT_TIMESTAMP 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'confirmed'
            `).run((existingSchedule as any).dish_id, (existingSchedule as any).schedule_date);
            
            const updatedOrders = db.prepare(`
              SELECT id FROM daily_orders 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'in_production'
            `).all((existingSchedule as any).dish_id, (existingSchedule as any).schedule_date) as any[];
            
            for (const order of updatedOrders) {
              logOperation(
                'update',
                'daily_order',
                order.id,
                JSON.stringify({ status: 'confirmed' }),
                JSON.stringify({ status: 'in_production' }),
                operator || 'system',
                `排程开始生产（菜品ID: ${(existingSchedule as any).dish_id}），订单进入生产中`
              );
            }
          }
          
          if (status === 'completed' && oldStatus === 'in_production') {
            db.prepare(`
              UPDATE daily_orders 
              SET status = 'production_completed', updated_at = CURRENT_TIMESTAMP 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'in_production'
            `).run((existingSchedule as any).dish_id, (existingSchedule as any).schedule_date);
            
            const updatedOrders = db.prepare(`
              SELECT id FROM daily_orders 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'production_completed'
            `).all((existingSchedule as any).dish_id, (existingSchedule as any).schedule_date) as any[];
            
            for (const order of updatedOrders) {
              logOperation(
                'update',
                'daily_order',
                order.id,
                JSON.stringify({ status: 'in_production' }),
                JSON.stringify({ status: 'production_completed' }),
                operator || 'system',
                `排程生产完成（菜品ID: ${(existingSchedule as any).dish_id}），订单生产完成，待配送`
              );
            }
          }
        }
        
        if (start_time !== undefined) {
          updates.push('start_time = ?');
          params.push(start_time);
        }
        
        if (end_time !== undefined) {
          updates.push('end_time = ?');
          params.push(end_time);
        }
        
        if (assigned_to !== undefined) {
          updates.push('assigned_to = ?');
          params.push(assigned_to);
        }
        
        if (notes !== undefined) {
          updates.push('notes = ?');
          params.push(notes);
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: '没有需要更新的字段' });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        
        db.prepare(`UPDATE production_schedules SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const updatedSchedule = db.prepare(`
          SELECT ps.*, d.name as dish_name, d.category as dish_category
          FROM production_schedules ps
          LEFT JOIN dishes d ON ps.dish_id = d.id
          WHERE ps.id = ?
        `).get(id) as ProductionSchedule;
        
        logOperation('update', 'production_schedule', Number(id), JSON.stringify(existingSchedule), JSON.stringify(updatedSchedule), operator || 'system');
        
        res.status(200).json({ success: true, data: updatedSchedule });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
