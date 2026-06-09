import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const level = searchParams.get("level");
  const where: any = {};
  if (status) where.status = status;
  if (level) where.level = level;
  const warnings = await prisma.warning.findMany({
    where,
    include: {
      pond: true,
      inspection: { include: { inspector: true } },
      handler: true,
      remarks: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [
      { level: "desc" },
      { createdAt: "desc" },
    ],
  });
  return NextResponse.json(warnings);
}
