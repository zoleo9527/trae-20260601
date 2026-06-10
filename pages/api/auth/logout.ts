import type { NextApiRequest, NextApiResponse } from "next";
import { logout } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  await logout();
  return res.status(200).json({ ok: true });
}
