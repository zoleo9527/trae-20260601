import { getDb } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, password } = await request.json();
	const db = getDb();
	const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as {
		id: number;
		username: string;
		role: string;
		display_name: string;
	} | undefined;

	if (!user) {
		return json({ error: '用户名或密码错误' }, { status: 401 });
	}

	const session = JSON.stringify({ id: user.id, username: user.username, role: user.role, display_name: user.display_name });
	cookies.set('session', session, {
		path: '/',
		httpOnly: false,
		maxAge: 60 * 60 * 24,
		sameSite: 'lax'
	});

	return json({ ok: true, user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name } });
};
