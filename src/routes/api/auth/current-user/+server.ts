import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { User } from '$lib/types';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	
	if (!sessionCookie) {
		return json({ user: null }, { status: 401 });
	}
	
	try {
		const session = JSON.parse(sessionCookie);
		const user = db.prepare('SELECT id, username, role, name, email FROM users WHERE id = ?').get(session.userId) as User | undefined;
		
		if (!user) {
			return json({ user: null }, { status: 401 });
		}
		
		return json({
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				name: user.name,
				email: user.email
			}
		});
	} catch {
		return json({ user: null }, { status: 401 });
	}
};