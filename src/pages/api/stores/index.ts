import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { Store, ApiResponse } from '@/types';

initDb();

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Store[] | Store>>
) {
  try {
    switch (req.method) {
      case 'GET':
        const stores = db.prepare('SELECT * FROM stores ORDER BY name').all() as Store[];
        res.status(200).json({ success: true, data: stores });
        break;
      
      case 'POST': {
        const { name, code, address, contact } = req.body;
        if (!name || !code) {
          return res.status(400).json({ success: false, error: '门店名称和编码不能为空' });
        }
        
        const result = db.prepare(
          'INSERT INTO stores (name, code, address, contact) VALUES (?, ?, ?, ?)'
        ).run(name, code, address, contact);
        
        const newStore = db.prepare('SELECT * FROM stores WHERE id = ?').get(result.lastInsertRowid) as Store;
        res.status(201).json({ success: true, data: newStore });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
