import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { HotspotStatus, ActionType } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const { dispatchId, content } = req.body;

  if (!dispatchId) {
    return res.status(400).json({ error: "派单 ID 不能为空" });
  }

  const dispatch = await prisma.dispatchOrder.findUnique({
    where: { id: dispatchId },
    include: { hotspot: true },
  });
  if (!dispatch) return res.status(404).json({ error: "派单不存在" });
  if (dispatch.hotspotId !== id) {
    return res.status(400).json({ error: "派单与热点不匹配" });
  }
  if (dispatch.assigneeId !== user.id) {
    return res.status(403).json({ error: "只有派单处理人才能标记完成" });
  }
  if (dispatch.hotspot.status !== HotspotStatus.IN_PROGRESS) {
    return res.status(400).json({ error: "当前状态不可标记完成" });
  }
  if (!dispatch.acceptedAt) {
    return res.status(400).json({ error: "派单未接单，无法标记完成" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispatchOrder.update({
      where: { id: dispatch.id },
      data: { completedAt: new Date() },
    });

    await tx.hotspotArea.update({
      where: { id: id as string },
      data: { status: HotspotStatus.COMPLETED, completedAt: new Date() },
    });

    await tx.commentHistory.create({
      data: {
        hotspotId: id as string,
        dispatchId: dispatch.id,
        authorId: user.id,
        actionType: ActionType.COMPLETE,
        content: content ? `【处理完成】${content}` : "【处理完成】现场已处理完毕。",
      },
    });
  });

  return res.status(200).json({ ok: true });
}
