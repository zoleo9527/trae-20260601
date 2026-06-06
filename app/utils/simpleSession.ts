import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { setCurrentUserId, getCurrentUser, findUserByUsername, verifyPassword } from "./dataService";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: ["super-secret-session-key-change-in-production"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
});

const USER_SESSION_KEY = "userId";

export async function getUserId(request: Request) {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  if (userId) {
    setCurrentUserId(userId);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return getCurrentUser();
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);
  const user = getCurrentUser();
  if (!user) {
    throw logout(request);
  }
  return user;
}

export async function login({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const isCorrectPassword = await verifyPassword(user, password);
  if (!isCorrectPassword) return null;

  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

export async function createUserSession({
  request,
  userId,
  redirectTo = "/",
}: {
  request: Request;
  userId: string;
  redirectTo?: string;
}) {
  setCurrentUserId(userId);
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  setCurrentUserId(null);
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}
