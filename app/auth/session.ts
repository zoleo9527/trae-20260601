import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { pool } from "../db/connection";

const sessionSecret = process.env.SESSION_SECRET || "motorcycle_training_secret";

const storage = createCookieSessionStorage({
  cookie: {
    name: "motorcycle_training_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
    httpOnly: true,
  },
});

export async function createSession(userId: number, role: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  session.set("role", role);
  return storage.commitSession(session);
}

export async function getSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function requireUser(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");
  const role = session.get("role");
  
  if (!userId || !role) {
    throw redirect("/login");
  }
  
  return { userId, role };
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function authenticate(username: string, password: string) {
  const users = await pool.query(
    "SELECT id, username, password_hash, role, name FROM users WHERE username = $1",
    [username]
  );
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}
