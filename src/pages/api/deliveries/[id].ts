import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { Delivery, ApiResponse } from '@/types';

initDb();

function logOperation(operationType: string, entityType: string, entityId: number, oldValue: string | null, newValue: string, operator: string, notes?: string) {
  db.prepare(
    'INSERT INTO operation_logs (operation_type, entity_type, entity_id, old_value, new_value, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(operationType, entityType, entityId, oldValue, newValue, operator, notes || null);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Delivery>>
) {
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case 'GET': {
        const delivery = db.prepare(`
          SELECT d.*, s.name as store_name, s.contact as store_contact, 
                 o.order_date, o.allergens_confirmation, o.special_instructions,
                 di.name as dish_name, di.specification, di.allergens as dish_allergens
          FROM deliveries d
          LEFT JOIN stores s ON d.store_id = s.id
          LEFT JOIN daily_orders o ON d.order_id = o.id
          LEFT JOIN dishes di ON d.dish_id = di.id
          WHERE d.id = ?
        `).get(id) as Delivery & { 
          store_name?: string; 
          store_contact?: string;
          order_date?: string; 
          allergens_confirmation?: string;
          special_instructions?: string;
          dish_name?: string; 
          specification?: string;
          dish_allergens?: string;
        };
        
        if (!delivery) {
          return res.status(404).json({ success: false, error: '配送单不存在' });
        }
        
        res.status(200).json({ success: true, data: delivery });
        break;
      }
      
      case 'PUT': {
        const { status, received_by, receiver_signature, notes, operator } = req.body;
        
        const existingDelivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
        if (!existingDelivery) {
          return res.status(404).json({ success: false, error: '配送单不存在' });
        }
        
        const updates: string[] = [];
        const params: any[] = [];
        
        if (status !== undefined) {
          updates.push('status = ?');
          params.push(status);
          
          if (status === 'dispatched') {
            updates.push('dispatched_at = CURRENT_TIMESTAMP');
          }
          
          if (status === 'received') {
            if (!received_by) {
              return res.status(400).json({ success: false, error: '请填写收货人姓名' });
            }
            updates.push('received_at = CURRENT_TIMESTAMP');
            updates.push('received_by = ?');
            params.push(received_by);
            
            if (receiver_signature) {
              updates.push('receiver_signature = ?');
              params.push(receiver_signature);
            }
          }
        }
        
        if (notes !== undefined) {
          updates.push('notes = ?');
          params.push(notes);
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: '没有需要更新的字段' });
        }
        
        params.push(id);
        
        db.prepare(`UPDATE deliveries SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        
        const updatedDelivery = db.prepare(`
          SELECT d.*, s.name as store_name, s.contact as store_contact, 
                 o.order_date, di.name as dish_name, di.specification
          FROM deliveries d
          LEFT JOIN stores s ON d.store_id = s.id
          LEFT JOIN daily_orders o ON d.order_id = o.id
          LEFT JOIN dishes di ON d.dish_id = di.id
          WHERE d.id = ?
        `).get(id);
        
        logOperation(
          'update',
          'delivery',
          id as number,
          JSON.stringify(existingDelivery),
          JSON.stringify(updatedDelivery),
          operator || 'system',
          status === 'received' ? `收货人: ${received_by}` : `状态更新为: ${status}`
        );
        
        if (status === 'received') {
          db.prepare(`UPDATE daily_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(existingDelivery.order_id);
          
          logOperation(
            'update',
            'daily_order',
            existingDelivery.order_id,
            null,
            JSON.stringify({ status: 'completed' }),
            operator || 'system',
            '门店收货确认，订单完成'
          );
        }
        
        res.status(200).json({ success: true, data: updatedDelivery as any });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
