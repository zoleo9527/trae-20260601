import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = parseAuth(req);
    const { payeeName, payeeBank, payeeAccount, submitRemark } = await req.json();
    if (!payeeName || !payeeAccount) {
      return NextResponse.json({ error: "收款人姓名和账号必填" }, { status: 400 });
    }

    const order = await prisma.recycleOrder.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "回收单不存在" }, { status: 404 });

    const amount = order.finalPrice || order.detectPrice;
    if (!amount) return NextResponse.json({ error: "尚未确定价格" }, { status: 400 });

    // 议价通过 → 打款申请，无空窗：状态一旦转移即产生 PaymentRequest
    const payment = await prisma.paymentRequest.create({
      data: {
        orderId: params.id,
        amount,
        payeeName,
        payeeBank,
        payeeAccount,
        submitRemark,
      },
    });

    await transitionOrderStatus(
      params.id,
      auth,
      "PAYMENT_REQUESTED",
      "PAYMENT_SUBMIT",
      submitRemark || `申请打款 ¥${amount}`,
      JSON.stringify({ paymentId: payment.id })
    );

    return NextResponse.json({ ok: true, paymentId: payment.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
