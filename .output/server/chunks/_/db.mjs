import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname$1 = path.dirname(fileURLToPath(globalThis._importMeta_.url));
const prismaClientSingleton = () => {
  const dbPath = path.join(__dirname$1, "..", "..", "prisma", "dev.db");
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  });
};
const prisma = prismaClientSingleton();
async function createOperationLog(caseId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, materialId) {
  return await prisma.operationLog.create({
    data: {
      caseId,
      operatorId,
      operatorRole,
      actionType,
      beforeStatus: beforeStatus || null,
      afterStatus: afterStatus || null,
      remark: remark || null,
      materialId: null
    }
  });
}
function generateReportNo() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
  return `BX${year}${month}${day}${random}`;
}

export { createOperationLog as c, generateReportNo as g, prisma as p };
//# sourceMappingURL=db.mjs.map
