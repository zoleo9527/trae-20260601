import db from './db.js';

export function checkOverdue() {
  const today = new Date().toISOString().slice(0, 10);
  const overdueNodes = db.prepare(`
    SELECT tn.*, p.name as patient_name
    FROM treatment_nodes tn
    JOIN patients p ON tn.patient_id = p.id
    WHERE tn.status = 'planned'
      AND tn.planned_date < ?
  `).all(today);

  let created = 0;
  for (const node of overdueNodes) {
    const existing = db.prepare(`
      SELECT id FROM alerts
      WHERE patient_id = ? AND type = 'missed_followup' AND is_read = 0
    `).get(node.patient_id);
    if (!existing) {
      db.prepare(`
        INSERT INTO alerts (patient_id, type, message)
        VALUES (?, 'missed_followup', ?)
      `).run(
        node.patient_id,
        `${node.patient_name}的${node.node_type}已逾期（计划日期：${node.planned_date}），请尽快处理`
      );
      created++;
    }
  }

  return { checked: overdueNodes.length, created };
}
