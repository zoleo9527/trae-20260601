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

const complete_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6848\u4EF6ID"
    });
  }
  const { operatorId } = body;
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u64CD\u4F5C\u4EBAID"
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
  const allMaterialsConfirmed = currentCase.materials.every(
    (m) => m.uploadStatus === "CONFIRMED"
  );
  if (!allMaterialsConfirmed) {
    throw createError({
      statusCode: 400,
      message: "\u6240\u6709\u6750\u6599\u5FC5\u987B\u786E\u8BA4\u540E\u624D\u80FD\u5B8C\u6210\u62A5\u6848"
    });
  }
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: "COMPLETED"
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
    "UNDERWRITER",
    "CONFIRM",
    currentCase.status,
    "COMPLETED",
    "\u6838\u8D54\u901A\u8FC7"
  );
  return { case: updatedCase };
});

export { complete_post as default };
//# sourceMappingURL=complete.post.mjs.map
