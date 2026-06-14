import { d as defineEventHandler, a as getQuery, c as createError } from '../../nitro/nitro.mjs';
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
  const caseId = query.caseId;
  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const materials = await prisma.materialList.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" }
  });
  return { materials };
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
