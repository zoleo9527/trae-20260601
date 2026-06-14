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

const verify_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u6750\u6599ID"
    });
  }
  const { operatorId, status, remark } = body;
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u64CD\u4F5C\u4EBAID"
    });
  }
  if (!status) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u5BA1\u6838\u72B6\u6001"
    });
  }
  if (status === "rejected" && !remark) {
    throw createError({
      statusCode: 400,
      message: "\u9A73\u56DE\u65F6\u5FC5\u987B\u586B\u5199\u539F\u56E0"
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
      uploadStatus: status === "confirmed" ? "CONFIRMED" : "NOT_UPLOADED",
      verifiedBy: operatorId,
      verifiedAt: /* @__PURE__ */ new Date()
    }
  });
  await createOperationLog(
    material.caseId,
    operatorId,
    "SURVEYOR",
    status === "confirmed" ? "CONFIRM" : "REJECT",
    material.uploadStatus,
    updatedMaterial.uploadStatus,
    remark || (status === "confirmed" ? "\u786E\u8BA4\u6750\u6599" : "\u9A73\u56DE\u6750\u6599")
  );
  return { material: updatedMaterial };
});

export { verify_post as default };
//# sourceMappingURL=verify.post.mjs.map
