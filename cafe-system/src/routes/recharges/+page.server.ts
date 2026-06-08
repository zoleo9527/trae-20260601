import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const status = url.searchParams.get('status') || '';

	let recharges;
	if (status) {
		recharges = db.prepare(`
			SELECT r.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
			FROM recharges r
			JOIN members m ON r.member_id = m.id
			JOIN users u ON r.operator_id = u.id
			LEFT JOIN users rv ON r.reviewer_id = rv.id
			WHERE r.status = ?
			ORDER BY r.created_at DESC
		`).all(status);
	} else {
		recharges = db.prepare(`
			SELECT r.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
			FROM recharges r
			JOIN members m ON r.member_id = m.id
			JOIN users u ON r.operator_id = u.id
			LEFT JOIN users rv ON r.reviewer_id = rv.id
			ORDER BY r.created_at DESC
		`).all();
	}

	return { recharges, currentStatus: status, user: locals.user };
};
