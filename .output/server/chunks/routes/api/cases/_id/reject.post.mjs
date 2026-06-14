import { d as defineEventHandler, g as getRouterParam, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { p as prisma, c as createOperationLog } from '../../../../_/db.mjs';
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

const reject_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const { operatorId, reason } = body;
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u64CD\u4F5C\u4EBAID"
    });
  }
  if (!reason) {
    throw createError({
      statusCode: 400,
      message: "\u9A73\u56DE\u539F\u56E0\u4E0D\u80FD\u4E3A\u7A7A"
    });
  }
  const currentCase = await prisma.caseReport.findUnique({
    where: { id }
  });
  if (!currentCase) {
    throw createError({
      statusCode: 404,
      message: "\u6848\u4EF6\u4E0D\u5B58\u5728"
    });
  }
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: "REJECTED"
    },
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
  await createOperationLog(
    id,
    operatorId,
    "SURVEYOR",
    "REJECT",
    currentCase.status,
    "REJECTED",
    reason
  );
  return { case: updatedCase };
});

export { reject_post as default };
//# sourceMappingURL=reject.post.mjs.map
