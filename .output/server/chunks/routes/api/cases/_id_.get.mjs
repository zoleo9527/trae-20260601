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
import 'url';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const caseReport = await prisma.caseReport.findUnique({
    where: { id },
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!caseReport) {
    throw createError({
      statusCode: 404,
      message: "\u6848\u4EF6\u4E0D\u5B58\u5728"
    });
  }
  return { case: caseReport };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
