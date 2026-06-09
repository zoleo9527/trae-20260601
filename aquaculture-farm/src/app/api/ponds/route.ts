import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const ponds = await prisma.pond.findMany({ include: { warnings: { where: { status: { in: ["ACTIVE","ACKNOWLEDGED"] } } } } });
  return NextResponse.json(ponds);
}
