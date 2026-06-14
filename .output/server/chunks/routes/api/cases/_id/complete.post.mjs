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

const complete_post = defineEventHandler(async (event) => {
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
  if (operatorRole !== "SURVEYOR") {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u6709\u67E5\u52D8\u5458\u624D\u80FD\u6267\u884C\u6B64\u64CD\u4F5C"
    });
  }
  const currentCase = await prisma.caseReport.findUnique({
    where: { id },
    include: {
      materials: true
    }
  });
  if (!currentCase) {
    throw createError({
      statusCode: 404,
      message: "\u6848\u4EF6\u4E0D\u5B58\u5728"
    });
  }
  if (currentCase.status !== "SUBMITTED") {
    throw createError({
      statusCode: 400,
      message: "\u6848\u4EF6\u72B6\u6001\u4E0D\u7B26\u5408\u8981\u6C42\uFF0C\u5FC5\u987B\u5148\u63D0\u4EA4\u62A5\u6848"
    });
  }
  const allMaterialsConfirmed = currentCase.materials.every(
    (m) => m.uploadStatus === "CONFIRMED"
  );
  if (!allMaterialsConfirmed) {
    throw createError({
      statusCode: 400,
      message: "\u6240\u6709\u6750\u6599\u5FC5\u987B\u786E\u8BA4\u540E\u624D\u80FD\u63D0\u4EA4\u6838\u8D54"
    });
  }
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW"
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
    "SUBMIT",
    currentCase.status,
    "PENDING_REVIEW",
    "\u67E5\u52D8\u5458\u786E\u8BA4\u6240\u6709\u6750\u6599\uFF0C\u63D0\u4EA4\u6838\u8D54"
  );
  return { case: updatedCase };
});

export { complete_post as default };
//# sourceMappingURL=complete.post.mjs.map
