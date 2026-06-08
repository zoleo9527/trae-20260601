import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const role = locals.user.role;

	const totalMembers = (db.prepare('SELECT COUNT(*) as c FROM members').get() as { c: number }).c;
	const pendingRecharges = (db.prepare("SELECT COUNT(*) as c FROM recharges WHERE status = 'pending'").get() as { c: number }).c;
	const pendingTimeGifts = (db.prepare("SELECT COUNT(*) as c FROM time_gifts WHERE status = 'pending'").get() as { c: number }).c;
	const rejectedRecharges = (db.prepare("SELECT COUNT(*) as c FROM recharges WHERE status = 'rejected'").get() as { c: number }).c;
	const rejectedTimeGifts = (db.prepare("SELECT COUNT(*) as c FROM time_gifts WHERE status = 'rejected'").get() as { c: number }).c;
	const activeSessions = (db.prepare("SELECT COUNT(*) as c FROM computer_sessions WHERE end_time IS NULL").get() as { c: number }).c;
	const ongoingRepairs = (db.prepare("SELECT COUNT(*) as c FROM equipment_repairs WHERE status IN ('reported', 'in_progress')").get() as { c: number }).c;
	const upcomingTournaments = (db.prepare("SELECT COUNT(*) as c FROM tournaments WHERE status IN ('upcoming', 'ongoing')").get() as { c: number }).c;

	let recentItems: any[] = [];

	if (role === 'admin') {
		const pendingRechargeList = db.prepare(`
			SELECT r.id, r.amount, r.bonus_minutes, r.status, r.created_at, m.name as member_name, u.display_name as operator_name
			FROM recharges r
			JOIN members m ON r.member_id = m.id
			JOIN users u ON r.operator_id = u.id
			WHERE r.status = 'pending'
			ORDER BY r.created_at DESC LIMIT 5
		`).all();

		const pendingGiftList = db.prepare(`
			SELECT tg.id, tg.minutes, tg.reason, tg.status, tg.created_at, m.name as member_name, u.display_name as operator_name
			FROM time_gifts tg
			JOIN members m ON tg.member_id = m.id
			JOIN users u ON tg.operator_id = u.id
			WHERE tg.status = 'pending'
			ORDER BY tg.created_at DESC LIMIT 5
		`).all();

		recentItems = [
			...pendingRechargeList.map((r: any) => ({ ...r, type: 'recharge' })),
			...pendingGiftList.map((g: any) => ({ ...g, type: 'time_gift' }))
		].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
	}

	if (role === 'operator') {
		const myRecharges = db.prepare(`
			SELECT r.id, r.amount, r.bonus_minutes, r.status, r.created_at, m.name as member_name
			FROM recharges r
			JOIN members m ON r.member_id = m.id
			WHERE r.operator_id = ?
			ORDER BY r.created_at DESC LIMIT 5
		`).all(locals.user.id);

		const myGifts = db.prepare(`
			SELECT tg.id, tg.minutes, tg.reason, tg.status, tg.created_at, m.name as member_name
			FROM time_gifts tg
			JOIN members m ON tg.member_id = m.id
			WHERE tg.operator_id = ?
			ORDER BY tg.created_at DESC LIMIT 5
		`).all(locals.user.id);

		recentItems = [
			...myRecharges.map((r: any) => ({ ...r, type: 'recharge' })),
			...myGifts.map((g: any) => ({ ...g, type: 'time_gift' }))
		].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
	}

	if (role === 'tournament') {
		const myTournaments = db.prepare(`
			SELECT t.*, COUNT(tr.id) as participant_count
			FROM tournaments t
			LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
			WHERE t.operator_id = ?
			GROUP BY t.id
			ORDER BY t.start_time DESC LIMIT 5
		`).all(locals.user.id);

		const myGifts = db.prepare(`
			SELECT tg.id, tg.minutes, tg.reason, tg.status, tg.created_at, m.name as member_name
			FROM time_gifts tg
			JOIN members m ON tg.member_id = m.id
			WHERE tg.operator_id = ?
			ORDER BY tg.created_at DESC LIMIT 5
		`).all(locals.user.id);

		recentItems = [
			...myTournaments.map((t: any) => ({ ...t, type: 'tournament' })),
			...myGifts.map((g: any) => ({ ...g, type: 'time_gift' }))
		].sort((a, b) => new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime()).slice(0, 8);
	}

	return {
		user: locals.user,
		stats: { totalMembers, pendingRecharges, pendingTimeGifts, rejectedRecharges, rejectedTimeGifts, activeSessions, ongoingRepairs, upcomingTournaments },
		recentItems,
		role
	};
};
