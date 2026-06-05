import { d as defineEventHandler, b as deleteCookie } from '../../../nitro/nitro.mjs';
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

const logout_post = defineEventHandler(async (event) => {
  deleteCookie(event, "auth_token", { path: "/" });
  deleteCookie(event, "user_id", { path: "/" });
  deleteCookie(event, "user_role", { path: "/" });
  return { success: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
