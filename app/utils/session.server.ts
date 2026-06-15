import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "~/utils/db.server";
import { Role } from "~/utils/constants";

const sessionSecret = process.env.SESSION_SECRET || "repair-shop-secret";

if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set");
  }
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "repair_shop_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo = "/") {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = { redirectTo: "/login" }
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId && typeof redirectTo === "string") {
    const searchParams = new URLSearchParams([["redirectTo", new URL(request.url).pathname]]);
    throw redirect(`${redirectTo}?${searchParams}`);
  }
  return userId;
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") return null;

  try {
    return await prisma.user.findUnique({
      select: { id: true, email: true, name: true, role: true },
      where: { id: userId },
    });
  } catch {
    return null;
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

export async function requireRole(request: Request, roles: Role[]) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  if (!roles.includes(user.role as Role)) {
    throw redirect("/");
  }
  return user;
}
