import { query } from '~/utils/db.server';

export async function getOperationLogs() {
  const result = await query(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ORDER BY ol.time DESC
  `);
  
  return result.rows.map(row => ({
    ...row,
    user: {
      id: row.user_id,
      name: row.user_name,
    },
  }));
}

export async function getLogsByTarget(targetType, targetId) {
  const result = await query(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.target_type = $1 AND ol.target_id = $2
    ORDER BY ol.time DESC
  `, [targetType, targetId]);
  
  return result.rows.map(row => ({
    ...row,
    user: {
      id: row.user_id,
      name: row.user_name,
    },
  }));
}

export async function createOperationLog(data) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const result = await query(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, time, remark)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [data.userId, data.action, data.targetType, data.targetId, now, data.remark]);
  
  return result.rows[0];
}
