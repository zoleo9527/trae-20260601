import { NextRequest } from "next/server";
import type { Role } from "@/types";

export interface ParsedAuth {
  userId: string;
  role: Role;
}

export function parseAuth(req: NextRequest): ParsedAuth {
  const header = req.headers.get("x-auth-user");
  if (!header) throw new Error("未登录");
  const [userId, role] = header.split("|");
  if (!userId || !role) throw new Error("登录信息无效");
  return { userId, role: role as Role };
}
