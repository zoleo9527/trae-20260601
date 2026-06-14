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

const upload_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6750\u6599ID"
    });
  }
  const { attachmentUrl, operatorId } = body;
  if (!attachmentUrl) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u9644\u4EF6URL"
    });
  }
  const material = await prisma.materialList.findUnique({
    where: { id }
  });
  if (!material) {
    throw createError({
      statusCode: 404,
      message: "\u6750\u6599\u4E0D\u5B58\u5728"
    });
  }
  const updatedMaterial = await prisma.materialList.update({
    where: { id },
    data: {
      attachmentUrl,
      uploadStatus: "UPLOADED"
    }
  });
  if (operatorId) {
    await createOperationLog(
      material.caseId,
      operatorId,
      "CLAIM_AGENT",
      "SUPPLEMENT",
      "NOT_UPLOADED",
      "UPLOADED",
      `\u4E0A\u4F20\u9644\u4EF6\uFF1A${material.materialName}`
    );
  }
  return { material: updatedMaterial };
});

export { upload_post as default };
//# sourceMappingURL=upload.post.mjs.map
