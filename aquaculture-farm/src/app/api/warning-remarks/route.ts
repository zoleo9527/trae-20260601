import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const warningId = searchParams.get("warningId");
  const where: any = {};
  if (warningId) where.warningId = parseInt(warningId);
  const remarks = await prisma.warningRemark.findMany({
    where,
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(remarks);
}

export async function POST(request: Request) {
  const data = await request.json();
  const remark = await prisma.warningRemark.create({
    data,
    include: { author: true },
  });
  return NextResponse.json(remark);
}
