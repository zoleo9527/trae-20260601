import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatusInternal } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// action: PAID | RETURNED
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = parseAuth(req);
    const { action, reviewRemark } = await req.json();

    const preCheck = await prisma.paymentRequest.findUnique({
      where: { id: params.id },
      include: { order: true },
    });
    if (!preCheck) return NextResponse.json({ error: "打款申请不存在" }, { status: 404 });

    let nextStatus: OrderStatus;
    let logAction: string;
    let data: any = { financeId: auth.userId, reviewRemark };

    if (action === "PAID") {
      nextStatus = "PAYMENT_PAID";
      logAction = "PAYMENT_PAID";
      data.paidAt = new Date();
    } else if (action === "RETURNED") {
      if (!reviewRemark) {
        return NextResponse.json({ error: "退回必须填写备注原因" }, { status: 400 });
      }
      nextStatus = "PAYMENT_RETURNED";
      logAction = "PAYMENT_RETURN";
    } else {
      return NextResponse.json({ error: "无效 action" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRequest.update({ where: { id: params.id }, data });

      await transitionOrderStatusInternal(
        tx,
        payment.orderId,
        auth,
        nextStatus,
        logAction,
        reviewRemark || (action === "PAID" ? `已打款 ¥${payment.amount}` : undefined),
        JSON.stringify({ paymentId: params.id })
      );

      return { ok: true };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
