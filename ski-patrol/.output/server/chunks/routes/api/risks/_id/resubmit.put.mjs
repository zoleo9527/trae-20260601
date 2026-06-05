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

const resubmit_put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const body = await readBody(event);
  const { supplementNote } = body;
  if (!supplementNote) throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u8865\u5145\u5907\u6CE8" });
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const db = getDb();
  const risk = db.prepare("SELECT * FROM risks WHERE id = ?").get(Number(id));
  if (!risk) throw createError({ statusCode: 404, message: "\u98CE\u9669\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  if (risk.status !== "rejected") throw createError({ statusCode: 400, message: "\u4EC5\u88AB\u9000\u56DE\u7684\u98CE\u9669\u53EF\u91CD\u65B0\u63D0\u4EA4" });
  db.prepare(
    "UPDATE risks SET status = ?, supplement_note = ? WHERE id = ?"
  ).run("resubmitted", supplementNote, Number(id));
  addAuditLog(db, "risk", Number(id), "resubmit", Number(userId), `\u91CD\u65B0\u63D0\u4EA4\u98CE\u9669\u4E0A\u62A5\uFF0C\u8865\u5145\u5907\u6CE8: ${supplementNote}`);
  return { success: true };
});

export { resubmit_put as default };
//# sourceMappingURL=resubmit.put.mjs.map
