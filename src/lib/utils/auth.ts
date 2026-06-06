import type { User, UserRole } from '$lib/types';
import type { Cookies } from '@sveltejs/kit';

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

export function getUserFromCookies(cookies: Cookies): User | null {
	try {
		const userId = cookies.get('userId');
		const userName = cookies.get('userName');
		const userRole = cookies.get('userRole') as UserRole | undefined;

		if (!userId || !userName || !userRole) return null;

		return {
			id: userId,
			name: userName,
			role: userRole
		};
	} catch {
		return null;
	}
}

export function setUserSession(cookies: Cookies, user: User): void {
	const options = {
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
		httpOnly: true,
		sameSite: 'strict' as const
	};
	cookies.set('userId', user.id, options);
	cookies.set('userName', user.name, options);
	cookies.set('userRole', user.role, options);
}

export function clearUserSession(cookies: Cookies): void {
	const options = { path: '/' };
	cookies.delete('userId', options);
	cookies.delete('userName', options);
	cookies.delete('userRole', options);
}

export function hasPermission(user: User | null, requiredRoles: UserRole[]): boolean {
	if (!user) return false;
	return requiredRoles.includes(user.role);
}

export function isConsultant(user: User | null): boolean {
	return user?.role === 'consultant';
}

export function isTeacher(user: User | null): boolean {
	return user?.role === 'teacher';
}

export function isAdmin(user: User | null): boolean {
	return user?.role === 'admin';
}

export function requireAuth(user: User | null, requiredRoles: UserRole[] = ['consultant', 'teacher', 'admin']): void {
	if (!user) {
		throw new AuthError('未登录');
	}
	if (!hasPermission(user, requiredRoles)) {
		throw new AuthError('权限不足');
	}
}
