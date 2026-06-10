import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
  const { filename, fileType, fileSize } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "文件名不能为空" });
  }

  const attachment = await prisma.attachment.create({
    data: {
      hotspotId: id as string,
      filename,
      fileType: fileType || "application/octet-stream",
      fileSize: fileSize || 0,
      placeholderUrl: `/placeholder-${Date.now()}`,
      uploadedBy: user.id,
    },
  });

  return res.status(200).json({ ok: true, attachment });
}
