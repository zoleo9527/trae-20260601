import { prisma } from "~/db.server";

export async function createCableRoute(data: {
  projectId: string;
  testRecordId?: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  cableType: string;
  length: number;
  description?: string;
}) {
  return prisma.cableRoute.create({ data });
}

export async function listCableRoutes(projectId: string, testRecordId?: string) {
  const where: Record<string, unknown> = { projectId };
  if (testRecordId) where.testRecordId = testRecordId;
  return prisma.cableRoute.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function updateCableRoute(
  id: string,
  data: {
    routeName?: string;
    startPoint?: string;
    endPoint?: string;
    cableType?: string;
    length?: number;
    description?: string;
  }
) {
  return prisma.cableRoute.update({ where: { id }, data });
}
