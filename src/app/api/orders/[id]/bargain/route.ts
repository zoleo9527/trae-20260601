import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// 议价复核处理
// action: SUBMIT_REVIEW | APPROVE | REJECT | ADJUST_AND_APPROVE
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = parseAuth(req);
    const { action, toPrice, reason, result } = await req.json();
    if (!reason) return NextResponse.json({ error: "请填写原因（必填，避免说不清）" }, { status: 400 });

    const order = await prisma.recycleOrder.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "回收单不存在" }, { status: 404 });

    const fromPrice = order.finalPrice || order.detectPrice || order.initialPrice || null;

    let nextStatus: OrderStatus;
    let logAction: string;
    let finalPrice: number | null = null;

    switch (action) {
      case "SUBMIT_REVIEW":
        nextStatus = "BARGAIN_REVIEW";
        logAction = "BARGAIN_SUBMIT";
        break;
      case "APPROVE":
        nextStatus = "BARGAIN_APPROVED";
        logAction = "BARGAIN_APPROVE";
        finalPrice = toPrice || Number(fromPrice);
        break;
      case "REJECT":
        nextStatus = "BARGAIN_REJECTED";
        logAction = "BARGAIN_REJECT";
        break;
      case "ADJUST_AND_APPROVE":
        if (!toPrice) return NextResponse.json({ error: "请填写调整后的价格" }, { status: 400 });
        nextStatus = "BARGAIN_APPROVED";
        logAction = "BARGAIN_ADJUST_APPROVE";
        finalPrice = toPrice;
        break;
      default:
        return NextResponse.json({ error: "无效 action" }, { status: 400 });
    }

    // 写议价记录
    await prisma.bargainRecord.create({
      data: {
        orderId: params.id,
        operatorId: auth.userId,
        fromPrice: fromPrice ?? undefined,
        toPrice: finalPrice ?? (toPrice ?? Number(fromPrice)),
        reason,
        result: result || reason,
        action,
      },
    });

    const updated = await transitionOrderStatus(
      params.id,
      auth,
      nextStatus,
      logAction,
      reason,
      JSON.stringify({ fromPrice, toPrice: finalPrice, action })
    );

    if (finalPrice !== null) {
      await prisma.recycleOrder.update({
        where: { id: params.id },
        data: { finalPrice },
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
