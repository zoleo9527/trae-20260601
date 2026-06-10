import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { UserRole, HotspotStatus, ActionType } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiAuth(req, res);
  if (!user) return;
  if (user.role !== UserRole.DISPATCHER && user.role !== UserRole.AREA_MANAGER) {
    return res.status(403).json({ error: "无权限调度派单" });
  }

  const { id } = req.query;
  const { instructions, assigneeId } = req.body;

  if (!instructions || !assigneeId) {
    return res.status(400).json({ error: "派单说明和处理人不能为空" });
  }

  const hotspot = await prisma.hotspotArea.findUnique({ where: { id: id as string } });
  if (!hotspot) return res.status(404).json({ error: "热点不存在" });
  if (hotspot.status !== HotspotStatus.PENDING) {
    return res.status(400).json({ error: "当前状态不可派单" });
  }

  const orderNo = `DD${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${String(
    Math.floor(Math.random() * 10000)
  ).padStart(4, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.dispatchOrder.create({
      data: {
        hotspotId: hotspot.id,
        orderNo,
        instructions,
        assigneeId,
      },
    });

    await tx.hotspotArea.update({
      where: { id: hotspot.id },
      data: {
        status: HotspotStatus.DISPATCHED,
        dispatcherId: user.id,
        dispatchedAt: new Date(),
      },
    });

    await tx.commentHistory.create({
      data: {
        hotspotId: hotspot.id,
        dispatchId: order.id,
        authorId: user.id,
        actionType: ActionType.DISPATCH,
        content: `【调度派单】派单编号 ${orderNo}，${instructions}`,
      },
    });

    return order;
  });

  return res.status(200).json({ ok: true, order: result });
}
