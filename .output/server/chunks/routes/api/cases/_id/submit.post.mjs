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

const submit_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const { operatorId, operatorRole } = body;
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u64CD\u4F5C\u4EBAID"
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
  if (currentCase.status !== "PENDING_SUBMIT" && currentCase.status !== "REJECTED" && currentCase.status !== "REVIEW_FAILED") {
    throw createError({
      statusCode: 400,
      message: "\u5F53\u524D\u72B6\u6001\u4E0D\u5141\u8BB8\u63D0\u4EA4"
    });
  }
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: "SUBMITTED"
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
    operatorRole || "CLAIM_AGENT",
    "SUBMIT",
    currentCase.status,
    "SUBMITTED",
    "\u63D0\u4EA4\u62A5\u6848"
  );
  return { case: updatedCase };
});

export { submit_post as default };
//# sourceMappingURL=submit.post.mjs.map
