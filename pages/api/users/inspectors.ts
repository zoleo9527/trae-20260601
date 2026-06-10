import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiAuth(req, res);
  if (!user) return;

  const inspectors = await prisma.user.findMany({
    where: { role: UserRole.INSPECTOR },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return res.status(200).json({ inspectors });
}
