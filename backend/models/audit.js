import db from './database.js';

export const auditService = {
  findAll(filters = {}) {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (filters.delegationId) {
      query += ' AND delegation_id = ?';
      params.push(filters.delegationId);
    }

    if (filters.actionType) {
      query += ' AND action_type = ?';
      params.push(filters.actionType);
    }

    if (filters.operator) {
      query += ' AND operator_username LIKE ?';
      params.push(`%${filters.operator}%`);
    }

    if (filters.startTime) {
      query += ' AND operate_time >= ?';
      params.push(filters.startTime);
    }

    if (filters.endTime) {
      query += ' AND operate_time <= ?';
      params.push(filters.endTime);
    }

    query += ' ORDER BY operate_time DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.page) {
        query += ' OFFSET ?';
        params.push((filters.page - 1) * filters.limit);
      }
    }

    const logs = db.prepare(query).all(...params);
    
    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details || '{}')
    }));
  },

  findByDelegationId(delegationId) {
    const logs = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE delegation_id = ? 
      ORDER BY operate_time DESC
    `).all(delegationId);

    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details || '{}')
    }));
  },

  create(delegationId, actionType, operator, previousStatus, newStatus, remarks, details) {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        delegation_id, action_type, previous_status, new_status,
        operator_username, operator_role, operator_name, remarks, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      delegationId,
      actionType,
      previousStatus,
      newStatus,
      operator.username,
      operator.role,
      operator.name,
      remarks || '',
      JSON.stringify(details || {})
    );

    return result.lastInsertRowid;
  }
};
