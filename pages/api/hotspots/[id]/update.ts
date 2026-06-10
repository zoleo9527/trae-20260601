import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ActionType } from "@/lib/types";

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

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "更新内容不能为空" });
  }

  await prisma.commentHistory.create({
    data: {
      hotspotId: id as string,
      dispatchId: dispatchId || null,
      authorId: user.id,
      actionType: ActionType.UPDATE,
      content: content.trim(),
    },
  });

  return res.status(200).json({ ok: true });
}
