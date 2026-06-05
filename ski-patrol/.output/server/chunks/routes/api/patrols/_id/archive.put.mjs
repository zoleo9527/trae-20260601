import { d as defineEventHandler, f as getRouterParam, c as createError, e as getCookie, a as getDb, h as addAuditLog } from '../../../../nitro/nitro.mjs';
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

const archive_put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "\u7F3A\u5C11ID" });
  const userId = getCookie(event, "user_id");
  if (!userId) throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  const db = getDb();
  const patrol = db.prepare("SELECT * FROM patrols WHERE id = ?").get(Number(id));
  if (!patrol) throw createError({ statusCode: 404, message: "\u5DE1\u67E5\u8BB0\u5F55\u4E0D\u5B58\u5728" });
  db.prepare(
    "UPDATE patrols SET status = ?, archived_at = datetime('now', 'localtime') WHERE id = ?"
  ).run("archived", Number(id));
  addAuditLog(db, "patrol", Number(id), "archive", Number(userId), "\u5DE1\u67E5\u8BB0\u5F55\u5DF2\u5F52\u6863");
  return { success: true };
});

export { archive_put as default };
//# sourceMappingURL=archive.put.mjs.map
