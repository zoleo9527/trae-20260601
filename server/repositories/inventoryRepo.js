import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

export function getAllInventory(filters = {}) {
  let sql = `
    SELECT i.*, p.name as pesticide_name, p.type as pesticide_type, p.unit
    FROM inventory i
    LEFT JOIN pesticides p ON i.pesticide_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.pesticideId) {
    sql += ' AND i.pesticide_id = ?';
    params.push(filters.pesticideId);
  }

  sql += ' ORDER BY p.name ASC';

  return db.prepare(sql).all(...params);
}

export function getInventoryById(id) {
  return db.prepare(`
    SELECT i.*, p.name as pesticide_name, p.type as pesticide_type, p.unit
    FROM inventory i
    LEFT JOIN pesticides p ON i.pesticide_id = p.id
    WHERE i.id = ?
  `).get(id);
}

export function updateInventory(id, data) {
  const updates = [];
  const params = [];

  if (data.quantity !== undefined) {
    updates.push('quantity = ?');
    params.push(data.quantity);
  }
  if (data.warningThreshold !== undefined) {
    updates.push('warning_threshold = ?');
    params.push(data.warningThreshold);
  }

  if (updates.length === 0) return getInventoryById(id);

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  return getInventoryById(id);
}

export function getInventoryWarnings() {
  return db.prepare(`
    SELECT i.*, p.name as pesticide_name, p.type as pesticide_type, p.unit
    FROM inventory i
    LEFT JOIN pesticides p ON i.pesticide_id = p.id
    WHERE i.quantity <= i.warning_threshold
    ORDER BY (i.quantity / NULLIF(i.warning_threshold, 0)) ASC
  `).all();
}

export function getSeasonalSuggestion() {
  // 基于历史销售数据生成季节性备货建议
  const currentMonth = new Date().getMonth() + 1;
  const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' :
                 currentMonth >= 6 && currentMonth <= 8 ? 'summer' :
                 currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';

  // 获取近3个月的销售数据统计
  const stats = db.prepare(`
    SELECT si.pesticide_id, p.name as pesticide_name, SUM(si.quantity) as total_sold,
           AVG(si.quantity) as avg_monthly
    FROM sales s
    JOIN sales_items si ON s.id = si.sales_id
    JOIN pesticides p ON si.pesticide_id = p.id
    WHERE s.status = 'completed'
      AND s.created_at >= DATE('now', '-3 months')
    GROUP BY si.pesticide_id
    ORDER BY total_sold DESC
  `).all();

  // 获取当前库存
  const inventory = db.prepare(`
    SELECT pesticide_id, quantity FROM inventory
  `).all();

  const inventoryMap = {};
  for (const inv of inventory) {
    inventoryMap[inv.pesticide_id] = inv.quantity;
  }

  return {
    season,
    suggestions: stats.map(stat => {
      const currentStock = inventoryMap[stat.pesticide_id] || 0;
      const recommendedStock = Math.ceil(stat.avg_monthly * 3); // 3个月的安全库存
      const action = currentStock < recommendedStock * 0.5 ? '补货' :
                     currentStock < recommendedStock ? '观察' : '充足';

      return {
        pesticideId: stat.pesticide_id,
        pesticideName: stat.pesticide_name,
        avgMonthly: Math.round(stat.avg_monthly),
        currentStock,
        recommendedStock,
        action
      };
    })
  };
}
