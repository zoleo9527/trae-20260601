import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// 批量议价通过 / 批量提交打款申请
export async function POST(req: NextRequest) {
  try {
    const auth = parseAuth(req);
    const { ids, operation } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "请选择要批量处理的单据" }, { status: 400 });
    }

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        if (operation === "BATCH_BARGAIN_APPROVE") {
          const order = await prisma.recycleOrder.findUnique({ where: { id } });
          if (!order || order.status !== "BARGAIN_REVIEW") {
            results.push({ id, ok: false, error: "状态不匹配，需为议价复核中" });
            continue;
          }
          const fromPrice = order.finalPrice || order.detectPrice || order.initialPrice;
          await prisma.bargainRecord.create({
            data: {
              orderId: id,
              operatorId: auth.userId,
              fromPrice: fromPrice ?? undefined,
              toPrice: Number(fromPrice),
              reason: "批量复核通过",
              result: "批量复核通过",
              action: "APPROVE",
            },
          });
          await transitionOrderStatus(
            id,
            auth,
            "BARGAIN_APPROVED",
            "BATCH_BARGAIN_APPROVE",
            "批量复核通过"
          );
          await prisma.recycleOrder.update({
            where: { id },
            data: { finalPrice: fromPrice },
          });
          results.push({ id, ok: true });
        } else if (operation === "BATCH_SUBMIT_PAYMENT") {
          const order = await prisma.recycleOrder.findUnique({ where: { id } });
          if (!order || order.status !== "BARGAIN_APPROVED") {
            results.push({ id, ok: false, error: "状态不匹配，需为议价通过" });
            continue;
          }
          const amount = order.finalPrice || order.detectPrice;
          if (!amount) {
            results.push({ id, ok: false, error: "尚未定价" });
            continue;
          }
          await prisma.paymentRequest.create({
            data: {
              orderId: id,
              amount,
              payeeName: order.customerName,
              payeeAccount: "BATCH-" + order.orderNo,
              submitRemark: "批量提交打款",
            },
          });
          await transitionOrderStatus(
            id,
            auth,
            "PAYMENT_REQUESTED",
            "BATCH_PAYMENT_SUBMIT",
            "批量提交打款申请"
          );
          results.push({ id, ok: true });
        } else if (operation === "BATCH_PAYMENT_PAID") {
          const payment = await prisma.paymentRequest.findUnique({
            where: { id },
            include: { order: true },
          });
          if (!payment || payment.order.status !== "PAYMENT_REQUESTED") {
            results.push({ id, ok: false, error: "状态不匹配" });
            continue;
          }
          await prisma.paymentRequest.update({
            where: { id },
            data: { financeId: auth.userId, paidAt: new Date(), reviewRemark: "批量打款完成" },
          });
          await transitionOrderStatus(
            payment.orderId,
            auth,
            "PAYMENT_PAID",
            "BATCH_PAYMENT_PAID",
            "批量打款完成"
          );
          results.push({ id, ok: true });
        } else {
          results.push({ id, ok: false, error: "无效操作" });
        }
      } catch (err) {
        results.push({ id, ok: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
