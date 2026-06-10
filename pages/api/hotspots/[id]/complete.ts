import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { HotspotStatus, ActionType } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getCurrentUser();
  if (!user) return res.status(401).json({ error: "未登录" });

  const { id } = req.query;
  const { dispatchId, content } = req.body;

  const hotspot = await prisma.hotspotArea.findUnique({ where: { id: id as string } });
  if (!hotspot) return res.status(404).json({ error: "热点不存在" });
  if (
    hotspot.status !== HotspotStatus.IN_PROGRESS &&
    hotspot.status !== HotspotStatus.DISPATCHED
  ) {
    return res.status(400).json({ error: "当前状态不可标记完成" });
  }

  await prisma.$transaction(async (tx) => {
    if (dispatchId) {
      await tx.dispatchOrder.update({
        where: { id: dispatchId },
        data: { completedAt: new Date() },
      });
    }

    await tx.hotspotArea.update({
      where: { id: id as string },
      data: { status: HotspotStatus.COMPLETED, completedAt: new Date() },
    });

    await tx.commentHistory.create({
      data: {
        hotspotId: id as string,
        dispatchId: dispatchId || null,
        authorId: user.id,
        actionType: ActionType.COMPLETE,
        content: content ? `【处理完成】${content}` : "【处理完成】现场已处理完毕。",
      },
    });
  });

  return res.status(200).json({ ok: true });
}
