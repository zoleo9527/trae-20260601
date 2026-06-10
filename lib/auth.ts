import type { IncomingMessage, ServerResponse } from "http";
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./prisma";
import { UserRole } from "./types";
import crypto from "crypto";

const SESSION_COOKIE = "bike_ops_session";
const COOKIE_MAX_AGE = 60 * 60 * 8;

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

export function encodeSession(user: SessionUser): string {
  const sessionValue = JSON.stringify(user);
  const signature = sign(sessionValue);
  return `${Buffer.from(sessionValue).toString("base64")}.${signature}`;
}

export function decodeSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  const [payloadB64, signature] = raw.split(".");
  if (!payloadB64 || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64").toString("utf-8");
  } catch {
    return null;
  }

  const expectedSig = sign(payload);
  if (signature !== expectedSig) return null;

  try {
    const parsed = JSON.parse(payload) as SessionUser;
    if (!parsed || !parsed.id || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildCookieHeader(value: string | null): string {
  const attrs = [
    `HttpOnly`,
    `SameSite=Lax`,
    `Path=/`,
    `Max-Age=${value === null ? 0 : COOKIE_MAX_AGE}`,
  ];
  return `${SESSION_COOKIE}=${value ?? ""}; ${attrs.join("; ")}`;
}

function setCookieHeader(res: ServerResponse, value: string | null) {
  const headerValue = buildCookieHeader(value);
  const existing = res.getHeader("Set-Cookie");
  if (existing === undefined) {
    res.setHeader("Set-Cookie", [headerValue]);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, headerValue]);
  } else {
    res.setHeader("Set-Cookie", [String(existing), headerValue]);
  }
}

export function attachSession(res: ServerResponse, user: SessionUser) {
  setCookieHeader(res, encodeSession(user));
}

export function clearSession(res: ServerResponse) {
  setCookieHeader(res, null);
}

function readCookieHeader(req: IncomingMessage): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  const pairs = header.split(";").map((s) => s.trim());
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx);
    if (name === SESSION_COOKIE) {
      return pair.slice(eqIdx + 1);
    }
  }
  return undefined;
}

export function getUserFromRequest(req: IncomingMessage): SessionUser | null {
  const raw = readCookieHeader(req);
  return decodeSession(raw);
}

export async function loginApi(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionUser | null> {
  const { username, password } = req.body ?? {};
  if (!username || !password) return null;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as UserRole,
  };

  attachSession(res, sessionUser);
  return sessionUser;
}

export async function requireApiAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionUser | null> {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "未登录" });
    return null;
  }
  return user;
}

export async function getServerAuth(
  context: GetServerSidePropsContext
): Promise<SessionUser | null> {
  return getUserFromRequest(context.req);
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
