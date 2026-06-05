import { d as defineEventHandler, e as getCookie, c as createError, a as getDb } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const userId = getCookie(event, "user_id");
  const userRole = getCookie(event, "user_role");
  if (!userId || !userRole) {
    throw createError({ statusCode: 401, message: "\u672A\u767B\u5F55" });
  }
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = ?").get(Number(userId), userRole);
  if (!user) {
    throw createError({ statusCode: 401, message: "\u7528\u6237\u4E0D\u5B58\u5728" });
  }
  return { id: user.id, name: user.name, role: user.role };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
