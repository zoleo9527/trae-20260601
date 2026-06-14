import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { prisma } from './db.server';
import type { UserRole } from '@prisma/client';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'bank_branch_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
}

function isSafeRedirect(redirectTo: string): boolean {
  if (!redirectTo) return false;
  if (!redirectTo.startsWith('/')) return false;
  if (redirectTo.startsWith('//')) return false;
  if (redirectTo.startsWith('/\\')) return false;
  return true;
}

export function getSafeRedirect(redirectTo: string | null | undefined, fallback: string = '/'): string {
  if (!redirectTo || typeof redirectTo !== 'string') return fallback;
  if (!isSafeRedirect(redirectTo)) return fallback;
  return redirectTo;
}

export async function requireUserId(request: Request, redirectTo?: string) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') {
    const url = new URL(request.url);
    const targetRedirect = redirectTo || `${url.pathname}${url.search}`;
    const searchParams = new URLSearchParams([['redirectTo', targetRedirect]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true, role: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, role: true },
  });
  if (!user) {
    throw logout(request);
  }
  return user;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}

export async function verifyLogin(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return { id: user.id, username: user.username, name: user.name, role: user.role };
}


