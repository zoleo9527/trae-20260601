import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatusInternal } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

// 检测定价：更新检测价 + 状态流转到 DETECTED + 日志，在同一事务内完成
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = parseAuth(req);
    const { detectPrice, remark } = await req.json();
    if (!detectPrice || detectPrice <= 0) {
      return NextResponse.json({ error: "请输入有效检测价" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.recycleOrder.update({
        where: { id: params.id },
        data: {
          detectPrice,
          detecterId: auth.userId,
        },
      });
      return transitionOrderStatusInternal(
        tx,
        params.id,
        auth,
        "DETECTED" as OrderStatus,
        "DETECT",
        remark || `检测完成，检测价 ¥${detectPrice}`
      );
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
