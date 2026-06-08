import { redirect, type RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE = 'cafe_session';

const sessions = new Map<string, { userId: number; role: string; displayName: string }>();

export function createSession(userId: number, role: string, displayName: string): string {
	const token = crypto.randomUUID();
	sessions.set(token, { userId, role, displayName });
	return token;
}

export function setSessionCookie(event: RequestEvent, token: string) {
	event.cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24
	});
}

export function clearSessionCookie(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSession(event: RequestEvent) {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return null;
	return sessions.get(token) ?? null;
}

export function destroySession(event: RequestEvent) {
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) sessions.delete(token);
	clearSessionCookie(event);
}

export function requireAuth(event: RequestEvent, roles?: string[]) {
	const session = getSession(event);
	if (!session) {
		throw redirect(302, '/login');
	}
	if (roles && !roles.includes(session.role)) {
		throw redirect(302, '/dashboard');
	}
	return session;
}
