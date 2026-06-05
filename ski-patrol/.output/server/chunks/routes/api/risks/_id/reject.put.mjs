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

const reject_put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const body = await readBody(event);
  const { reason } = body;
  if (!reason) throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u9000\u56DE\u539F\u56E0" });
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const userRole = getCookie(event, "user_role");
  if (userRole !== "coach") throw createError({ statusCode: 403, message: "\u4EC5\u6559\u7EC3\u4E3B\u7BA1\u53EF\u9000\u56DE\u98CE\u9669\u4E0A\u62A5" });
  const db = getDb();
  const risk = db.prepare("SELECT * FROM risks WHERE id = ?").get(Number(id));
  if (!risk) throw createError({ statusCode: 404, message: "\u98CE\u9669\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  db.prepare(
    "UPDATE risks SET status = ?, reject_reason = ? WHERE id = ?"
  ).run("rejected", reason, Number(id));
  addAuditLog(db, "risk", Number(id), "reject", Number(userId), `\u9000\u56DE\u98CE\u9669\u4E0A\u62A5\uFF0C\u539F\u56E0: ${reason}`);
  return { success: true };
});

export { reject_put as default };
//# sourceMappingURL=reject.put.mjs.map
