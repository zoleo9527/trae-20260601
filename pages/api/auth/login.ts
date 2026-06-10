import type { NextApiRequest, NextApiResponse } from "next";
import { loginApi } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }

  const user = await loginApi(req, res);
  if (!user) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }

  return res.status(200).json({ user });
}
