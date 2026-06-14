import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { g as generateReportNo, p as prisma, c as createOperationLog } from '../../_/db.mjs';
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
  const { policyNo, policyHolder, accidentDesc, reporterId } = body;
  if (!policyNo || !policyHolder || !accidentDesc || !reporterId) {
    throw createError({
      statusCode: 400,
      message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5"
    });
  }
  const reportNo = generateReportNo();
  const newCase = await prisma.caseReport.create({
    data: {
      reportNo,
      policyNo,
      policyHolder,
      accidentDesc,
      reporterId,
      status: "PENDING_SUBMIT"
    },
    include: {
      materials: true,
      logs: true
    }
  });
  await createOperationLog(
    newCase.id,
    reporterId,
    "CLAIM_AGENT",
    "SUBMIT",
    void 0,
    "PENDING_SUBMIT",
    "\u521B\u5EFA\u62A5\u6848"
  );
  return { case: newCase };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
