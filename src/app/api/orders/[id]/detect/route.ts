import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAuth } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-flow";
import type { OrderStatus } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = parseAuth(req);
    const { detectPrice, remark } = await req.json();
    if (!detectPrice || detectPrice <= 0) {
      return NextResponse.json({ error: "请输入有效检测价" }, { status: 400 });
    }

    await prisma.recycleOrder.update({
      where: { id: params.id },
      data: {
        detectPrice,
        detecterId: auth.userId,
      },
    });

    const updated = await transitionOrderStatus(
      params.id,
      auth,
      "DETECTED",
      "DETECT",
      remark || `检测完成，检测价 ¥${detectPrice}`
    );

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
