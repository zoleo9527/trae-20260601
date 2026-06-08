import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const status = url.searchParams.get('status') || '';

	let timeGifts;
	if (status) {
		timeGifts = db.prepare(`
			SELECT tg.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
			FROM time_gifts tg
			JOIN members m ON tg.member_id = m.id
			JOIN users u ON tg.operator_id = u.id
			LEFT JOIN users rv ON tg.reviewer_id = rv.id
			WHERE tg.status = ?
			ORDER BY tg.created_at DESC
		`).all(status);
	} else {
		timeGifts = db.prepare(`
			SELECT tg.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
			FROM time_gifts tg
			JOIN members m ON tg.member_id = m.id
			JOIN users u ON tg.operator_id = u.id
			LEFT JOIN users rv ON tg.reviewer_id = rv.id
			ORDER BY tg.created_at DESC
		`).all();
	}

	return { timeGifts, currentStatus: status, user: locals.user };
};
