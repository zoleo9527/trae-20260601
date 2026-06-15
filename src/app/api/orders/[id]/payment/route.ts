import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatusInternal } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// 提交打款申请：创建 PaymentRequest + 状态流转到 PAYMENT_REQUESTED + 日志，同一事务内完成
// 支持两种来源状态：BARGAIN_APPROVED（首次提交）、PAYMENT_RETURNED（财务退回后重新提交）
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

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRequest.create({
        data: {
          orderId: params.id,
          amount,
          payeeName,
          payeeBank,
          payeeAccount,
          submitRemark,
        },
      });
      const updated = await transitionOrderStatusInternal(
        tx,
        params.id,
        auth,
        "PAYMENT_REQUESTED" as OrderStatus,
        order.status === "PAYMENT_RETURNED" ? "PAYMENT_RESUBMIT" : "PAYMENT_SUBMIT",
        submitRemark || `申请打款 ¥${amount}`,
        JSON.stringify({ paymentId: payment.id })
      );
      return { payment, updated };
    });

    return NextResponse.json({ ok: true, paymentId: result.payment.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
