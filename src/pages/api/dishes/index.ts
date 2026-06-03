import type { NextApiRequest, NextApiResponse } from 'next';
import db, { initDb } from '@/lib/db';
import type { Dish, ApiResponse } from '@/types';

initDb();

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Dish[] | Dish>>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { category } = req.query;
        let sql = 'SELECT * FROM dishes WHERE is_active = 1';
        const params: any[] = [];
        
        if (category) {
          sql += ' AND category = ?';
          params.push(category);
        }
        
        sql += ' ORDER BY category, name';
        const dishes = db.prepare(sql).all(...params) as Dish[];
        res.status(200).json({ success: true, data: dishes });
        break;
      }
      
      case 'POST': {
        const { name, code, category, allergens, unit, specification, production_time } = req.body;
        if (!name || !code || !category) {
          return res.status(400).json({ success: false, error: '菜品名称、编码和分类不能为空' });
        }
        
        const result = db.prepare(
          'INSERT INTO dishes (name, code, category, allergens, unit, specification, production_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(name, code, category, allergens || '无', unit || '份', specification, production_time || 30);
        
        const newDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(result.lastInsertRowid) as Dish;
        res.status(201).json({ success: true, data: newDish });
        break;
      }
      
      default:
        res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
