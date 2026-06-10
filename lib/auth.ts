import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "./types";
import crypto from "crypto";

const SESSION_COOKIE = "bike_ops_session";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function login(username: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const sessionValue = JSON.stringify(sessionUser);
  const signature = sign(sessionValue);
  const cookieValue = `${Buffer.from(sessionValue).toString("base64")}.${signature}`;

  cookies().set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return sessionUser;
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie) return null;

  const [payloadB64, signature] = cookie.value.split(".");
  if (!payloadB64 || !signature) return null;

  const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
  const expectedSig = sign(payload);

  if (signature !== expectedSig) return null;

  try {
    return JSON.parse(payload) as SessionUser;
  } catch {
    return null;
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.INSPECTOR:
      return "巡检员";
    case UserRole.DISPATCHER:
      return "调度员";
    case UserRole.AREA_MANAGER:
      return "区域经理";
  }
}
