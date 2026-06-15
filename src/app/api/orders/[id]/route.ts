import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    parseAuth(req);
    const order = await prisma.recycleOrder.findUnique({
      where: { id: params.id },
      include: {
        receiver: { select: { id: true, name: true, role: true } },
        detecter: { select: { id: true, name: true, role: true } },
        bargains: {
          orderBy: { createdAt: "desc" },
          include: { operator: { select: { id: true, name: true, role: true } } },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { finance: { select: { id: true, name: true, role: true } } },
        },
        logs: {
          orderBy: { createdAt: "asc" },
          include: { operator: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
