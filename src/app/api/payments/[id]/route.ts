import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    parseAuth(req);

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: params.id },
      include: {
        finance: { select: { id: true, name: true, role: true } },
        order: {
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
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "打款申请不存在" }, { status: 404 });
    }

    const order = payment.order;
    const payments = order.payments || [];
    const lastPay = payments[0];
    const resubmitCount = Math.max(0, payments.length - 1);

    let latestHandler: { name: string; role: string } | null = null;
    let latestProcessTime: string | null = null;

    if (lastPay) {
      if (lastPay.paidAt || lastPay.reviewRemark) {
        latestHandler = lastPay.finance ? { name: lastPay.finance.name, role: lastPay.finance.role } : null;
        latestProcessTime = (lastPay.paidAt || lastPay.updatedAt).toISOString();
      } else {
        latestHandler = order.detecter ? { name: order.detecter.name, role: order.detecter.role } : null;
        latestProcessTime = lastPay.createdAt.toISOString();
      }
    }

    const returnedPayment = payments.find((p) => p.reviewRemark && !p.paidAt);
    const returnReason = returnedPayment ? returnedPayment.reviewRemark : null;

    const enriched = {
      ...order,
      currentPaymentId: payment.id,
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
