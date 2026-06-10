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
  const { dispatchId, remark } = req.body;

  const dispatch = await prisma.dispatchOrder.findUnique({
    where: { id: dispatchId },
  });
  if (!dispatch) return res.status(404).json({ error: "派单不存在" });
  if (dispatch.assigneeId !== user.id) {
    return res.status(403).json({ error: "该派单不是指派给您的" });
  }
  if (dispatch.acceptedAt) {
    return res.status(400).json({ error: "该派单已接单" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispatchOrder.update({
      where: { id: dispatch.id },
      data: { acceptorId: user.id, acceptedAt: new Date() },
    });

    await tx.hotspotArea.update({
      where: { id: id as string },
      data: { status: HotspotStatus.IN_PROGRESS },
    });

    await tx.commentHistory.create({
      data: {
        hotspotId: id as string,
        dispatchId: dispatch.id,
        authorId: user.id,
        actionType: ActionType.ACCEPT,
        content: remark ? `已接单：${remark}` : "已接单，正在赶赴现场。",
      },
    });
  });

  return res.status(200).json({ ok: true });
}
