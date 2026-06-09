import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const records = await prisma.feedRecord.findMany({ include: { pond: true, operator: true }, orderBy: { fedAt: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const data = await req.json();
  const record = await prisma.feedRecord.create({ data });
  return NextResponse.json(record);
}
