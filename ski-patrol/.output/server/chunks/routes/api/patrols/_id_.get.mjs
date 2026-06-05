import { d as defineEventHandler, f as getRouterParam, c as createError, a as getDb } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const db = getDb();
  const patrol = db.prepare(`
    SELECT p.*, t.name as trail_name, t.difficulty as trail_difficulty, t.status as trail_status,
           u.name as creator_name, u.role as creator_role
    FROM patrols p
    LEFT JOIN trails t ON p.trail_id = t.id
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE p.id = ?
  `).get(Number(id));
  if (!patrol) throw createError({ statusCode: 404, message: "\u5DE1\u67E5\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  const auditLogs = db.prepare(
    "SELECT a.*, u.name as operator_name FROM audit_logs a LEFT JOIN users u ON a.operator_id = u.id WHERE a.entity_type = ? AND a.entity_id = ? ORDER BY a.created_at ASC"
  ).all("patrol", Number(id));
  const risks = db.prepare(`
    SELECT r.*, u.name as reporter_name
    FROM risks r
    LEFT JOIN users u ON r.creator_id = u.id
    WHERE r.patrol_id = ?
    ORDER BY r.created_at DESC
  `).all(Number(id));
  return {
    id: patrol.id,
    trailId: patrol.trail_id,
    trailName: patrol.trail_name,
    trailDifficulty: patrol.trail_difficulty,
    trailStatus: patrol.trail_status,
    creatorId: patrol.creator_id,
    creatorName: patrol.creator_name,
    creatorRole: patrol.creator_role,
    type: patrol.type,
    status: patrol.status,
    result: patrol.result,
    conclusion: patrol.conclusion,
    createdAt: patrol.created_at,
    completedAt: patrol.completed_at,
    archivedAt: patrol.archived_at,
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      operatorName: l.operator_name,
      detail: l.detail,
      createdAt: l.created_at
    })),
    risks: risks.map((r) => ({
      id: r.id,
      level: r.level,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      createdAt: r.created_at
    }))
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
