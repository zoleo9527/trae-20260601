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
        payments: {
          orderBy: { createdAt: "desc" },
          include: { finance: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    const enriched = orders.map((o) => {
      const payments = o.payments || [];
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
          latestHandler = o.detecter ? { name: o.detecter.name, role: o.detecter.role } : null;
          latestProcessTime = lastPay.createdAt.toISOString();
        }
        if (o.status === "PAYMENT_RETURNED" && lastPay.reviewRemark) {
          returnReason = lastPay.reviewRemark;
        } else {
          const returnedPayment = payments.find((p) => p.reviewRemark && !p.paidAt);
          if (returnedPayment) {
            returnReason = returnedPayment.reviewRemark;
          }
        }
      }

      return {
        ...o,
        payments: payments.slice(0, 1),
        resubmitCount,
        latestHandler,
        latestProcessTime,
        returnReason,
      };
    });

    return NextResponse.json({ orders: enriched, auth });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
