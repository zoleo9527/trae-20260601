import { createSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const action = formData.get('action');

		if (action === 'logout') {
			cookies.delete('cafe_session', { path: '/' });
			throw redirect(302, '/login');
		}

		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: '请输入用户名和密码' });
		}

		const db = getDb();
		const user = db
			.prepare('SELECT id, username, display_name, role, password FROM users WHERE username = ?')
			.get(username) as {
			id: number;
			username: string;
			display_name: string;
			role: string;
			password: string;
		} | undefined;

		if (!user || user.password !== password) {
			return fail(400, { error: '用户名或密码错误' });
		}

		const token = createSession(user.id, user.role, user.display_name);
		cookies.set('cafe_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});

		throw redirect(302, '/dashboard');
	}
};
