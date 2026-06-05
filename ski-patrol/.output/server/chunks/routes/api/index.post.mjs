import { d as defineEventHandler, r as readBody, c as createError, e as getCookie, a as getDb, h as addAuditLog } from '../../nitro/nitro.mjs';
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

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { trailId, type } = body;
  if (!trailId || !type) {
    throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" });
  }
  const userId = getCookie(event, "user_id");
  if (!userId) {
    throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  }
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO patrols (trail_id, creator_id, type, status) VALUES (?, ?, ?, ?)"
  ).run(trailId, Number(userId), type, "pending");
  const patrolId = result.lastInsertRowid;
  addAuditLog(db, "patrol", Number(patrolId), "create", Number(userId), `\u521B\u5EFA\u5DE1\u67E5\u5355\uFF0C\u96EA\u9053ID: ${trailId}\uFF0C\u7C7B\u578B: ${type}`);
  return { id: patrolId, trailId, type, status: "pending" };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
