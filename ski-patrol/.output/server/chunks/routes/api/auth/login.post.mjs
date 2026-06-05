import { d as defineEventHandler, g as getQuery, c as createError, a as getDb, s as setCookie } from '../../../nitro/nitro.mjs';
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

const login_post = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const role = query.role;
  if (!role || !["rental", "coach", "patrol"].includes(role)) {
    throw createError({ statusCode: 400, message: "\u65E0\u6548\u7684\u89D2\u8272\u7C7B\u578B" });
  }
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE role = ?").get(role);
  if (!user) {
    throw createError({ statusCode: 404, message: "\u7528\u6237\u4E0D\u5B58\u5728" });
  }
  const token = `demo-${role}-${Date.now()}`;
  setCookie(event, "auth_token", token, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: "/"
  });
  setCookie(event, "user_id", String(user.id), {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: "/"
  });
  setCookie(event, "user_role", user.role, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: "/"
  });
  return {
    token,
    user: { id: user.id, name: user.name, role: user.role }
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
