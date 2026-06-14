import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prismaClientSingleton = () => {
  const projectRoot = process.cwd()
  const dbPath = path.join(projectRoot, 'prisma', 'dev.db')
  
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  })
}

const prisma = prismaClientSingleton()

export default prisma

export async function createOperationLog(
  caseId: string,
  operatorId: string,
  operatorRole: string,
  actionType: string,
  beforeStatus?: string,
  afterStatus?: string,
  remark?: string,
  materialId?: string
) {
  return await prisma.operationLog.create({
    data: {
      caseId,
      operatorId,
      operatorRole,
      actionType,
      beforeStatus: beforeStatus || null,
      afterStatus: afterStatus || null,
      remark: remark || null,
      materialId: materialId || null
    }
  })
}

export function generateReportNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BX${year}${month}${day}${random}`
}
