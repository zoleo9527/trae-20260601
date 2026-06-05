import { d as defineEventHandler, a as getDb } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const db = getDb();
  const trails = db.prepare("SELECT * FROM trails ORDER BY id ASC").all();
  return trails;
});

export { index_get as default };
//# sourceMappingURL=index.get4.mjs.map
