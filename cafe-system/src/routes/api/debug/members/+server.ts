import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 });
	}
	const db = getDb();
	const members = db.prepare('SELECT id, name, phone, balance, bonus_minutes FROM members ORDER BY name').all();
	return new Response(JSON.stringify({ members, user: locals.user }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
