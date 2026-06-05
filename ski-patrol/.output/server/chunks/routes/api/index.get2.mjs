import { d as defineEventHandler, g as getQuery, a as getDb } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = query.status;
  const keyword = query.keyword;
  const db = getDb();
  let sql = `
    SELECT r.*, p.id as patrol_id, p.trail_id, t.name as trail_name,
           u.name as creator_name
    FROM risks r
    LEFT JOIN patrols p ON r.patrol_id = p.id
    LEFT JOIN trails t ON p.trail_id = t.id
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += " AND r.status = ?";
    params.push(status);
  }
  if (keyword) {
    sql += " AND (t.name LIKE ? OR r.description LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += " ORDER BY r.created_at DESC";
  const risks = db.prepare(sql).all(...params);
  return risks.map((r) => ({
    id: r.id,
    patrolId: r.patrol_id,
    trailName: r.trail_name,
    trailId: r.trail_id,
    level: r.level,
    description: r.description,
    urgency: r.urgency,
    status: r.status,
    rejectReason: r.reject_reason,
    supplementNote: r.supplement_note,
    approveAction: r.approve_action,
    approveNote: r.approve_note,
    creatorName: r.creator_name,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
    archivedAt: r.archived_at
  }));
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
