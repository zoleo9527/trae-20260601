import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const recharge = db.prepare(`
		SELECT r.*, m.name as member_name, m.phone as member_phone, m.balance as member_balance, m.bonus_minutes as member_bonus,
			u.display_name as operator_name, rv.display_name as reviewer_name
		FROM recharges r
		JOIN members m ON r.member_id = m.id
		JOIN users u ON r.operator_id = u.id
		LEFT JOIN users rv ON r.reviewer_id = rv.id
		WHERE r.id = ?
	`).get(params.id) as any;

	if (!recharge) throw redirect(302, '/recharges');

	const logs = db.prepare(`
		SELECT ol.*, u.display_name as operator_name
		FROM operation_logs ol
		LEFT JOIN users u ON ol.operator_id = u.id
		WHERE ol.entity_type = 'recharge' AND ol.entity_id = ?
		ORDER BY ol.created_at ASC
	`).all(params.id);

	const linkedGift = db.prepare(`
		SELECT tg.*, rv.display_name as reviewer_name
		FROM time_gifts tg
		LEFT JOIN users rv ON tg.reviewer_id = rv.id
		WHERE tg.recharge_id = ?
	`).get(params.id) as any;

	const memberRecentRecords = db.prepare(`
		SELECT * FROM (
			SELECT r.id, 'recharge' as type, r.amount as value_num, '' as value_unit,
				r.status, r.created_at, r.bonus_minutes
			FROM recharges r
			WHERE r.member_id = ? AND date(r.created_at) >= date('now', 'localtime', '-30 days')
			UNION ALL
			SELECT tg.id, 'time_gift' as type, tg.minutes as value_num, '分钟' as value_unit,
				tg.status, tg.created_at, 0 as bonus_minutes
			FROM time_gifts tg
			WHERE tg.member_id = ? AND date(tg.created_at) >= date('now', 'localtime', '-30 days')
		)
		ORDER BY created_at DESC
		LIMIT 10
	`).all(recharge.member_id, recharge.member_id);

	return { recharge, logs, linkedGift, memberRecentRecords, user: locals.user };
};

export const actions: Actions = {
	approve: async ({ locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const db = getDb();
		const recharge = db.prepare('SELECT * FROM recharges WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!recharge) return fail(400, { error: '该充值单无法审核' });

		db.transaction(() => {
			db.prepare(`
				UPDATE recharges SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
				WHERE id = ?
			`).run(locals.user!.id, params.id);

			db.prepare(`
				UPDATE members SET balance = balance + ?
				WHERE id = ?
			`).run(recharge.amount, recharge.member_id);

			addLog('recharge', Number(params.id), 'approve', locals.user!.id,
				`审核通过，余额+${recharge.amount}元`);

			if (recharge.bonus_minutes > 0) {
				db.prepare(`
					UPDATE time_gifts SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
					WHERE recharge_id = ? AND status = 'pending'
				`).run(locals.user!.id, params.id);

				db.prepare(`
					UPDATE members SET bonus_minutes = bonus_minutes + ?
					WHERE id = ?
				`).run(recharge.bonus_minutes, recharge.member_id);

				const linkedGift = db.prepare('SELECT id FROM time_gifts WHERE recharge_id = ?').get(params.id) as any;
				if (linkedGift) {
					addLog('time_gift', linkedGift.id, 'approve', locals.user!.id,
						`随充值单#${params.id}复核通过，赠送时长+${recharge.bonus_minutes}分钟`);
				}
			}
		})();

		throw redirect(302, `/recharges/${params.id}`);
	},

	reject: async ({ locals, params, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const note = formData.get('review_note') as string;

		if (!note?.trim()) {
			return fail(400, { error: '退回时必须填写原因' });
		}

		const db = getDb();
		const recharge = db.prepare('SELECT * FROM recharges WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!recharge) return fail(400, { error: '该充值单无法审核' });

		db.transaction(() => {
			db.prepare(`
				UPDATE recharges SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
				WHERE id = ?
			`).run(locals.user.id, note.trim(), params.id);

			addLog('recharge', Number(params.id), 'reject', locals.user.id,
				`已退回，原因：${note.trim()}`);

			const linkedGift = db.prepare('SELECT id FROM time_gifts WHERE recharge_id = ? AND status = ?').get(params.id, 'pending') as any;
			if (linkedGift) {
				db.prepare(`
					UPDATE time_gifts SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user.id, `充值单已退回，关联赠送自动退回`, linkedGift.id);

				addLog('time_gift', linkedGift.id, 'reject', locals.user.id,
					`复核不通过：充值单已退回，关联赠送自动退回`);
			}
		})();

		throw redirect(302, `/recharges/${params.id}`);
	},

	cancel: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const db = getDb();
		const recharge = db.prepare('SELECT * FROM recharges WHERE id = ? AND status = ?').get(params.id, 'pending') as any;
		if (!recharge) return fail(400, { error: '只能取消待审核的充值单' });
		if (recharge.operator_id !== locals.user.id && locals.user.role !== 'admin') {
			return fail(403, { error: '只能取消自己提交的充值单' });
		}

		db.transaction(() => {
			db.prepare(`
				UPDATE recharges SET status = 'cancelled', cancelled_by = ?, cancelled_at = datetime('now', 'localtime')
				WHERE id = ?
			`).run(locals.user.id, params.id);

			addLog('recharge', Number(params.id), 'cancel', locals.user.id,
				`已取消充值`);

			const linkedGift = db.prepare('SELECT id FROM time_gifts WHERE recharge_id = ? AND status = ?').get(params.id, 'pending') as any;
			if (linkedGift) {
				db.prepare(`
					UPDATE time_gifts SET status = 'cancelled', cancelled_by = ?, cancelled_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user.id, linkedGift.id);

				addLog('time_gift', linkedGift.id, 'cancel', locals.user.id,
					`充值单已取消，关联赠送自动取消`);
			}
		})();

		throw redirect(302, `/recharges/${params.id}`);
	}
};
