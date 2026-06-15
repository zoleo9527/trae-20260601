import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import type { OrderStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const auth = parseAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const keyword = searchParams.get("keyword") || "";

    const where: any = {};
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { customerName: { contains: keyword } },
        { customerPhone: { contains: keyword } },
        { deviceType: { contains: keyword } },
      ];
    }

    const orders = await prisma.recycleOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        receiver: { select: { id: true, name: true, role: true } },
        detecter: { select: { id: true, name: true, role: true } },
        bargains: { orderBy: { createdAt: "desc" }, take: 1 },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return NextResponse.json({ orders, auth });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
