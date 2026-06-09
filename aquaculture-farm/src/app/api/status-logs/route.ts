import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = parseInt(entityId);
  const logs = await prisma.statusLog.findMany({
    where,
    include: { operator: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}
