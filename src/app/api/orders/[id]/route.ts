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

    const payments = order.payments || [];
    const lastPay = payments[0];
    const resubmitCount = Math.max(0, payments.length - 1);

    let latestHandler: { name: string; role: string } | null = null;
    let latestProcessTime: string | null = null;
    let returnReason: string | null = null;

    if (lastPay) {
      if (lastPay.paidAt || lastPay.reviewRemark) {
        latestHandler = lastPay.finance ? { name: lastPay.finance.name, role: lastPay.finance.role } : null;
        latestProcessTime = (lastPay.paidAt || lastPay.updatedAt).toISOString();
      } else {
        latestHandler = order.detecter ? { name: order.detecter.name, role: order.detecter.role } : null;
        latestProcessTime = lastPay.createdAt.toISOString();
      }
      if (order.status === "PAYMENT_RETURNED" && lastPay.reviewRemark) {
        returnReason = lastPay.reviewRemark;
      }
    }

    const enriched = {
      ...order,
      resubmitCount,
      latestHandler,
      latestProcessTime,
      returnReason,
    };

    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
