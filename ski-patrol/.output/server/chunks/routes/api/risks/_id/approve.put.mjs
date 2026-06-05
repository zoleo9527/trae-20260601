import { d as defineEventHandler, f as getRouterParam, c as createError, r as readBody, e as getCookie, a as getDb, h as addAuditLog } from '../../../../nitro/nitro.mjs';
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

const approve_put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const body = await readBody(event);
  const { action, note } = body;
  if (!action) throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u5BA1\u6279\u52A8\u4F5C" });
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const userRole = getCookie(event, "user_role");
  if (userRole !== "coach") throw createError({ statusCode: 403, message: "\u4EC5\u6559\u7EC3\u4E3B\u7BA1\u53EF\u5BA1\u6279" });
  const db = getDb();
  const risk = db.prepare("SELECT * FROM risks WHERE id = ?").get(Number(id));
  if (!risk) throw createError({ statusCode: 404, message: "\u98CE\u9669\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  db.prepare(
    "UPDATE risks SET status = ?, approve_action = ?, approve_note = ?, resolved_at = datetime('now', 'localtime') WHERE id = ?"
  ).run("approved", action, note || null, Number(id));
  const actionLabel = action === "reschedule" ? "\u6539\u671F" : "\u8865\u5F55";
  addAuditLog(db, "risk", Number(id), "approve", Number(userId), `\u5BA1\u6279\u901A\u8FC7\uFF0C\u5904\u7406\u65B9\u5F0F: ${actionLabel}${note ? "\uFF0C\u5907\u6CE8: " + note : ""}`);
  return { success: true };
});

export { approve_put as default };
//# sourceMappingURL=approve.put.mjs.map
