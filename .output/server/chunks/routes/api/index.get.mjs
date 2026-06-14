import { d as defineEventHandler, a as getQuery } from '../../nitro/nitro.mjs';
import { p as prisma } from '../../_/db.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';
import 'path';
import 'url';

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  let where = {};
  if (query.status) {
    where = { ...where, status: query.status };
  }
  if (query.role) {
    const role = query.role;
    where = {
      ...where,
      reporterId: role === "CLAIM_AGENT" ? { not: "" } : void 0
    };
  }
  const cases = await prisma.caseReport.findMany({
    where,
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return { cases };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
