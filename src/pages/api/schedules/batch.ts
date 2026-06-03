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
        const { ids, status, operator, assigned_to } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ success: false, error: '请选择要处理的排程' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        const existingSchedules = db.prepare(`SELECT * FROM production_schedules WHERE id IN (${placeholders})`).all(...ids);
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (status !== undefined) {
          updates.push('status = ?');
          params.push(status);
        }
        
        if (assigned_to !== undefined) {
          updates.push('assigned_to = ?');
          params.push(assigned_to);
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: '没有需要更新的字段' });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(...ids);
        
        db.prepare(`UPDATE production_schedules SET ${updates.join(', ')} WHERE id IN (${placeholders})`).run(...params);
        
        const updatedSchedules = db.prepare(`
          SELECT ps.*, d.name as dish_name, d.category as dish_category
          FROM production_schedules ps
          LEFT JOIN dishes d ON ps.dish_id = d.id
          WHERE ps.id IN (${placeholders})
        `).all(...ids);
        
        if (status !== undefined) {
          const scheduledToInProd = existingSchedules.filter((s: any) => s.status === 'scheduled' && status === 'in_production');
          const inProdToCompleted = existingSchedules.filter((s: any) => s.status === 'in_production' && status === 'completed');
          
          for (const schedule of scheduledToInProd) {
            const s = schedule as any;
            db.prepare(`
              UPDATE daily_orders 
              SET status = 'in_production', updated_at = CURRENT_TIMESTAMP 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'confirmed'
            `).run(s.dish_id, s.schedule_date);
            
            const updatedOrders = db.prepare(`
              SELECT id FROM daily_orders 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'in_production'
            `).all(s.dish_id, s.schedule_date) as any[];
            
            for (const order of updatedOrders) {
              logOperation(
                'update',
                'daily_order',
                order.id,
                JSON.stringify({ status: 'confirmed' }),
                JSON.stringify({ status: 'in_production' }),
                operator || 'system',
                `排程开始生产（菜品ID: ${s.dish_id}），订单进入生产中`
              );
            }
          }
          
          for (const schedule of inProdToCompleted) {
            const s = schedule as any;
            db.prepare(`
              UPDATE daily_orders 
              SET status = 'production_completed', updated_at = CURRENT_TIMESTAMP 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'in_production'
            `).run(s.dish_id, s.schedule_date);
            
            const updatedOrders = db.prepare(`
              SELECT id FROM daily_orders 
              WHERE dish_id = ? 
              AND order_date = ? 
              AND status = 'production_completed'
            `).all(s.dish_id, s.schedule_date) as any[];
            
            for (const order of updatedOrders) {
              logOperation(
                'update',
                'daily_order',
                order.id,
                JSON.stringify({ status: 'in_production' }),
                JSON.stringify({ status: 'production_completed' }),
                operator || 'system',
                `排程生产完成（菜品ID: ${s.dish_id}），订单生产完成，待配送`
              );
            }
          }
        }
        
        logOperation(
          'batch_update',
          'production_schedule',
          0,
          JSON.stringify(existingSchedules),
          JSON.stringify(updatedSchedules),
          operator || 'system',
          `批量更新排程，共 ${ids.length} 条`
        );
        
        res.status(200).json({ success: true, data: updatedSchedules, message: `成功处理 ${ids.length} 条排程` });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
