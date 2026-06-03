import db, { initDb } from '@/lib/db';
import type { ApiResponse, Delivery } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

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
        `).get(id);
        
        if (!delivery) {
          return res.status(404).json({ success: false, error: '配送单不存在' });
        }
        
        res.status(200).json({ success: true, data: delivery as any });
        break;
      }
      
      case 'PUT': {
        const { status, received_by, receiver_signature, notes, operator } = req.body;
        
        const existingDelivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as any;
        if (!existingDelivery) {
          return res.status(404).json({ success: false, error: '配送单不存在' });
        }

        if (status === 'dispatched' && existingDelivery.status !== 'pending') {
          return res.status(400).json({ success: false, error: '只有待发货的配送单可以发货' });
        }

        if (status === 'received' && existingDelivery.status !== 'dispatched') {
          return res.status(400).json({ success: false, error: '只有配送中的配送单可以确认收货' });
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
            if (!received_by || !received_by.trim()) {
              return res.status(400).json({ success: false, error: '请填写收货人姓名' });
            }
            updates.push('received_at = CURRENT_TIMESTAMP');
            updates.push('received_by = ?');
            params.push(received_by.trim());
            
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
                 o.order_date, o.allergens_confirmation, o.special_instructions,
                 di.name as dish_name, di.specification, di.allergens as dish_allergens
          FROM deliveries d
          LEFT JOIN stores s ON d.store_id = s.id
          LEFT JOIN daily_orders o ON d.order_id = o.id
          LEFT JOIN dishes di ON d.dish_id = di.id
          WHERE d.id = ?
        `).get(id);

        const oldStatus = existingDelivery.status;
        const logNotes = status === 'dispatched'
          ? `配送单发货，门店: ${(updatedDelivery as any).store_name}`
          : status === 'received'
            ? `门店收货确认，收货人: ${received_by}`
            : `状态更新为: ${status}`;
        
        logOperation(
          'update',
          'delivery',
          Number(id),
          JSON.stringify({ status: oldStatus }),
          JSON.stringify({ status }),
          operator || 'system',
          logNotes
        );

        if (status === 'dispatched') {
          db.prepare(`UPDATE daily_orders SET status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(existingDelivery.order_id);
          
          logOperation(
            'update',
            'daily_order',
            existingDelivery.order_id,
            JSON.stringify({ status: 'ready_for_dispatch' }),
            JSON.stringify({ status: 'dispatched' }),
            operator || 'system',
            '配送单已发货，订单状态更新为已发货'
          );
        }
        
        if (status === 'received') {
          db.prepare(`UPDATE daily_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(existingDelivery.order_id);
          
          logOperation(
            'update',
            'daily_order',
            existingDelivery.order_id,
            JSON.stringify({ status: 'dispatched' }),
            JSON.stringify({ status: 'completed' }),
            operator || 'system',
            `门店收货确认，订单完成。收货人: ${received_by}`
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
