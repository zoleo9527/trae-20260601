import type { Handle } from '@sveltejs/kit';
import { initSchema } from '$lib/db.js';
import { seedData } from '$lib/seed.js';

initSchema();
seedData();

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');
	if (session) {
		try {
			const user = JSON.parse(session);
			event.locals.user = user;
		} catch {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	const isPublic = event.url.pathname === '/login' || event.url.pathname.startsWith('/api/auth');
	if (!isPublic && !event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { location: '/login' }
		});
	}

	return resolve(event);
};
