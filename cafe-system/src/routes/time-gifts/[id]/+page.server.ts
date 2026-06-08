import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const timeGift = db.prepare(`
		SELECT tg.*, m.name as member_name, m.phone as member_phone, m.balance as member_balance, m.bonus_minutes as member_bonus,
			u.display_name as operator_name, rv.display_name as reviewer_name
		FROM time_gifts tg
		JOIN members m ON tg.member_id = m.id
		JOIN users u ON tg.operator_id = u.id
		LEFT JOIN users rv ON tg.reviewer_id = rv.id
		WHERE tg.id = ?
	`).get(params.id) as any;

	if (!timeGift) throw redirect(302, '/time-gifts');

	const logs = db.prepare(`
		SELECT ol.*, u.display_name as operator_name
		FROM operation_logs ol
		LEFT JOIN users u ON ol.operator_id = u.id
		WHERE ol.entity_type = 'time_gift' AND ol.entity_id = ?
		ORDER BY ol.created_at ASC
	`).all(params.id);

	let linkedTournament: any = null;
	if (timeGift.source_type === 'tournament' && timeGift.source_id) {
		linkedTournament = db.prepare('SELECT id, name, game, status FROM tournaments WHERE id = ?').get(timeGift.source_id);
	}

	let linkedRecharge: any = null;
	if (timeGift.source_type === 'recharge_bonus' && timeGift.recharge_id) {
		linkedRecharge = db.prepare('SELECT id, amount, bonus_minutes, status, payment_method FROM recharges WHERE id = ?').get(timeGift.recharge_id);
	}

	const memberGiftHistory = db.prepare(`
		SELECT tg.id, tg.minutes, tg.reason, tg.source_type, tg.status, tg.created_at,
			u.display_name as operator_name, rv.display_name as reviewer_name
		FROM time_gifts tg
		JOIN users u ON tg.operator_id = u.id
		LEFT JOIN users rv ON tg.reviewer_id = rv.id
		WHERE tg.member_id = ? AND tg.id != ?
		ORDER BY tg.created_at DESC LIMIT 10
	`).all(timeGift.member_id, timeGift.id);

	return { timeGift, logs, linkedTournament, linkedRecharge, memberGiftHistory, user: locals.user };
};

export const actions: Actions = {
	approve: async ({ locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const db = getDb();
		const gift = db.prepare('SELECT * FROM time_gifts WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!gift) return fail(400, { error: '该赠送单无法审核' });

		db.transaction(() => {
			db.prepare(`
				UPDATE time_gifts SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
				WHERE id = ?
			`).run(locals.user!.id, params.id);

			db.prepare(`
				UPDATE members SET bonus_minutes = bonus_minutes + ?
				WHERE id = ?
			`).run(gift.minutes, gift.member_id);

			addLog('time_gift', Number(params.id), 'approve', locals.user!.id,
				`复核通过，赠送时长+${gift.minutes}分钟`);
		})();

		throw redirect(302, `/time-gifts/${params.id}`);
	},

	reject: async ({ locals, params, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const note = formData.get('review_note') as string;

		if (!note?.trim()) {
			return fail(400, { error: '复核不通过时必须填写原因' });
		}

		const db = getDb();
		const gift = db.prepare('SELECT * FROM time_gifts WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!gift) return fail(400, { error: '该赠送单无法审核' });

		db.prepare(`
			UPDATE time_gifts SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
			WHERE id = ?
		`).run(locals.user.id, note.trim(), params.id);

		addLog('time_gift', Number(params.id), 'reject', locals.user.id,
			`复核不通过，原因：${note.trim()}`);

		throw redirect(302, `/time-gifts/${params.id}`);
	},

	cancel: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const db = getDb();
		const gift = db.prepare('SELECT * FROM time_gifts WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!gift) return fail(400, { error: '只能取消待审核的赠送单' });
		if (gift.operator_id !== locals.user.id && locals.user.role !== 'admin') {
			return fail(403, { error: '只能取消自己提交的赠送单' });
		}

		db.prepare(`
			UPDATE time_gifts SET status = 'cancelled', cancelled_by = ?, cancelled_at = datetime('now', 'localtime')
			WHERE id = ?
		`).run(locals.user.id, params.id);

		addLog('time_gift', Number(params.id), 'cancel', locals.user.id,
			`已取消时长赠送`);

		throw redirect(302, `/time-gifts/${params.id}`);
	}
};
