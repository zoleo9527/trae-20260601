import { createCookieSessionStorage, redirect } from '@remix-run/node'
import type { User } from 'shared/types'

const sessionSecret = process.env.SESSION_SECRET || 'parking-complaint-secret-key-change-in-production'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'parking_complaint_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
})

export async function getUserSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))
  const user = session.get('user') as User | undefined
  return { session, user }
}

export async function requireUser(request: Request) {
  const { session, user } = await getUserSession(request)
  if (!user) {
    throw redirect('/login')
  }
  return { session, user }
}

export async function createUserSession(user: User, redirectTo: string) {
  const session = await sessionStorage.getSession()
  session.set('user', user)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  })
}

export async function destroyUserSession(request: Request) {
  const { session } = await getUserSession(request)
  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  })
}
