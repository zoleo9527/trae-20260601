import { d as defineEventHandler, i as resetDb } from '../../../nitro/nitro.mjs';
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

const reset_post = defineEventHandler(async (event) => {
  resetDb();
  return { success: true };
});

export { reset_post as default };
//# sourceMappingURL=reset.post.mjs.map
