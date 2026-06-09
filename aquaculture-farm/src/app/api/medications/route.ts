import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const records = await prisma.medicationRecord.findMany({
    include: { pond: true, administrator: true, followUpHandler: true },
    orderBy: { administeredAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const data = await req.json();
  const record = await prisma.medicationRecord.create({
    data,
    include: { pond: true, administrator: true, followUpHandler: true },
  });
  return NextResponse.json(record);
}
