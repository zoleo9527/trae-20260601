import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const member = db.prepare('SELECT * FROM members WHERE id = ?').get(params.id) as any;
	if (!member) throw redirect(302, '/members');

	const recharges = db.prepare(`
		SELECT r.*, u.display_name as operator_name, rv.display_name as reviewer_name,
			(SELECT tg.id FROM time_gifts tg WHERE tg.recharge_id = r.id LIMIT 1) as linked_gift_id
		FROM recharges r
		LEFT JOIN users u ON r.operator_id = u.id
		LEFT JOIN users rv ON r.reviewer_id = rv.id
		WHERE r.member_id = ?
		ORDER BY r.created_at DESC
	`).all(params.id);

	const timeGifts = db.prepare(`
		SELECT tg.*, u.display_name as operator_name, rv.display_name as reviewer_name
		FROM time_gifts tg
		LEFT JOIN users u ON tg.operator_id = u.id
		LEFT JOIN users rv ON tg.reviewer_id = rv.id
		WHERE tg.member_id = ?
		ORDER BY tg.created_at DESC
	`).all(params.id);

	const sessions = db.prepare(`
		SELECT cs.*, u.display_name as operator_name
		FROM computer_sessions cs
		LEFT JOIN users u ON cs.operator_id = u.id
		WHERE cs.member_id = ?
		ORDER BY cs.start_time DESC
	`).all(params.id);

	const regs = db.prepare(`
		SELECT tr.*, t.name as tournament_name, t.game
		FROM tournament_registrations tr
		JOIN tournaments t ON tr.tournament_id = t.id
		WHERE tr.member_id = ?
		ORDER BY tr.registered_at DESC
	`).all(params.id);

	const logs = db.prepare(`
		SELECT ol.*, u.display_name as operator_name,
			CASE WHEN ol.entity_type = 'time_gift' THEN (SELECT tg.source_type FROM time_gifts tg WHERE tg.id = ol.entity_id) END as source_type
		FROM operation_logs ol
		LEFT JOIN users u ON ol.operator_id = u.id
		WHERE (ol.entity_type = 'member' AND ol.entity_id = ?)
			OR (ol.entity_type = 'recharge' AND ol.entity_id IN (SELECT id FROM recharges WHERE member_id = ?))
			OR (ol.entity_type = 'time_gift' AND ol.entity_id IN (SELECT id FROM time_gifts WHERE member_id = ?))
		ORDER BY ol.created_at DESC
		LIMIT 50
	`).all(params.id, params.id, params.id);

	return { member, recharges, timeGifts, sessions, regs, logs };
};
