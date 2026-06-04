import { GetServerSidePropsContext } from 'next';
import { User } from '@prisma/client';
import prisma from './db';

export const SESSION_COOKIE = 'health_session';

export async function login(username: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

export async function getUserFromSession(sessionId: string): Promise<User | null> {
  if (!sessionId) return null;
  
  try {
    const userId = sessionId;
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch {
    return null;
  }
}

export async function requireAuth(context: GetServerSidePropsContext): Promise<{ user: User; redirect?: never } | { redirect: { destination: string; permanent: boolean }; user?: never }> {
  const sessionId = context.req.cookies[SESSION_COOKIE];
  const user = sessionId ? await getUserFromSession(sessionId) : null;

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return { user };
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}
