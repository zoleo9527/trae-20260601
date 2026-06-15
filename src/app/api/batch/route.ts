import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatusInternal } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// 批量操作：单笔内全部用事务，确保状态与记录一致
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
          await prisma.$transaction(async (tx) => {
            const order = await tx.recycleOrder.findUnique({ where: { id } });
            if (!order || order.status !== "BARGAIN_REVIEW") {
              throw new Error("状态不匹配，需为议价复核中");
            }
            const fromPrice = order.finalPrice || order.detectPrice || order.initialPrice;
            await tx.bargainRecord.create({
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
            await transitionOrderStatusInternal(
              tx,
              id,
              auth,
              "BARGAIN_APPROVED" as OrderStatus,
              "BATCH_BARGAIN_APPROVE",
              "批量复核通过"
            );
            await tx.recycleOrder.update({
              where: { id },
              data: { finalPrice: fromPrice },
            });
          });
          results.push({ id, ok: true });
        } else if (operation === "BATCH_SUBMIT_PAYMENT") {
          await prisma.$transaction(async (tx) => {
            const order = await tx.recycleOrder.findUnique({ where: { id } });
            if (!order || order.status !== "BARGAIN_APPROVED") {
              throw new Error("状态不匹配，需为议价通过");
            }
            const amount = order.finalPrice || order.detectPrice;
            if (!amount) throw new Error("尚未定价");
            const payment = await tx.paymentRequest.create({
              data: {
                orderId: id,
                amount,
                payeeName: order.customerName,
                payeeAccount: "BATCH-" + order.orderNo,
                submitRemark: "批量提交打款",
              },
            });
            await transitionOrderStatusInternal(
              tx,
              id,
              auth,
              "PAYMENT_REQUESTED" as OrderStatus,
              "BATCH_PAYMENT_SUBMIT",
              "批量提交打款申请",
              JSON.stringify({ paymentId: payment.id })
            );
          });
          results.push({ id, ok: true });
        } else if (operation === "BATCH_PAYMENT_PAID") {
          await prisma.$transaction(async (tx) => {
            const payment = await tx.paymentRequest.findUnique({
              where: { id },
              include: { order: true },
            });
            if (!payment || payment.order.status !== "PAYMENT_REQUESTED") {
              throw new Error("状态不匹配");
            }
            await tx.paymentRequest.update({
              where: { id },
              data: {
                financeId: auth.userId,
                paidAt: new Date(),
                reviewRemark: "批量打款完成",
              },
            });
            await transitionOrderStatusInternal(
              tx,
              payment.orderId,
              auth,
              "PAYMENT_PAID" as OrderStatus,
              "BATCH_PAYMENT_PAID",
              "批量打款完成"
            );
          });
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
