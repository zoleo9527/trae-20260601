import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const search = url.searchParams.get('search') || '';

	let members;
	if (search) {
		members = db.prepare(`
			SELECT * FROM members
			WHERE name LIKE ? OR phone LIKE ?
			ORDER BY created_at DESC
		`).all(`%${search}%`, `%${search}%`);
	} else {
		members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
	}

	return { members, search };
};
