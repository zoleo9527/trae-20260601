import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { p as prisma, c as createOperationLog } from '../../_/db.mjs';
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

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { caseId, materialName, materialType, reporterId } = body;
  if (!caseId || !materialName || !materialType) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5"
    });
  }
  const newMaterial = await prisma.materialList.create({
    data: {
      caseId,
      materialName,
      materialType,
      uploadStatus: "NOT_UPLOADED"
    }
  });
  if (reporterId) {
    await createOperationLog(
      caseId,
      reporterId,
      "CLAIM_AGENT",
      "SUPPLEMENT",
      void 0,
      "NOT_UPLOADED",
      `\u6DFB\u52A0\u6750\u6599\uFF1A${materialName}`
    );
  }
  return { material: newMaterial };
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
