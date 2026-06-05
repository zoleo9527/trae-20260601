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

const complete_put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const body = await readBody(event);
  const { result, conclusion } = body;
  if (!result || !conclusion) {
    throw createError({ statusCode: 400, message: "\u7F3A\u5C11\u5DE1\u67E5\u7ED3\u679C\u6216\u7ED3\u8BBA" });
  }
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const db = getDb();
  const patrol = db.prepare("SELECT * FROM patrols WHERE id = ?").get(Number(id));
  if (!patrol) throw createError({ statusCode: 404, message: "\u5DE1\u67E5\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  db.prepare(
    "UPDATE patrols SET status = ?, result = ?, conclusion = ?, completed_at = datetime('now', 'localtime') WHERE id = ?"
  ).run("completed", result, conclusion, Number(id));
  addAuditLog(db, "patrol", Number(id), "complete", Number(userId), `\u5B8C\u6210\u5DE1\u67E5\uFF0C\u7ED3\u679C: ${result === "normal" ? "\u6B63\u5E38" : "\u6709\u95EE\u9898"}\uFF0C\u7ED3\u8BBA: ${conclusion}`);
  return { success: true };
});

export { complete_put as default };
//# sourceMappingURL=complete.put.mjs.map
