import { getSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = getSession(event);
	if (session) {
		const db = getDb();
		const user = db
			.prepare('SELECT id, username, display_name, role FROM users WHERE id = ?')
			.get(session.userId) as {
			id: number;
			username: string;
			display_name: string;
			role: 'admin' | 'operator' | 'tournament';
		} | undefined;
		event.locals.user = user ?? null;
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
