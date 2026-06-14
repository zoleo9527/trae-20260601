import { d as defineEventHandler, g as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { p as prisma } from '../../../_/db.mjs';
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

const _caseId__get = defineEventHandler(async (event) => {
  const caseId = getRouterParam(event, "caseId");
  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const logs = await prisma.operationLog.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" }
  });
  return { logs };
});

export { _caseId__get as default };
//# sourceMappingURL=_caseId_.get.mjs.map
