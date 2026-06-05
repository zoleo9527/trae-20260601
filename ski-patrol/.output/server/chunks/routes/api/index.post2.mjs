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
  const { patrolId, level, description, urgency } = body;
  if (!patrolId || !level || !description) {
    throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" });
  }
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO risks (patrol_id, level, description, urgency, status, creator_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(patrolId, level, description, urgency || "normal", "reported", Number(userId));
  const riskId = result.lastInsertRowid;
  db.prepare("UPDATE patrols SET result = ? WHERE id = ? AND result IS NULL").run("issue", patrolId);
  addAuditLog(db, "risk", Number(riskId), "report", Number(userId), `\u4E0A\u62A5\u98CE\u9669\uFF0C\u7B49\u7EA7: ${level}\uFF0C\u7D27\u6025\u7A0B\u5EA6: ${urgency || "normal"}\uFF0C\u63CF\u8FF0: ${description}`);
  addAuditLog(db, "patrol", patrolId, "risk_reported", Number(userId), `\u5DE1\u67E5\u5355\u5173\u8054\u98CE\u9669\u4E0A\u62A5 #${riskId}`);
  return { id: riskId, patrolId, level, status: "reported" };
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
