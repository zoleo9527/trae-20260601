import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status ? { status: status as any } : {};
  const inspections = await prisma.inspection.findMany({
    where,
    include: {
      pond: true,
      inspector: true,
      warnings: { select: { id: true, level: true, status: true, metric: true, message: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json(inspections);
}

export async function POST(request: Request) {
  const data = await request.json();
  const inspection = await prisma.inspection.create({
    data,
    include: { pond: true, inspector: true },
  });
  return NextResponse.json(inspection);
}
