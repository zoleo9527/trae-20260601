import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const status = url.searchParams.get('status') || '';
	const keyword = (url.searchParams.get('keyword') || '').trim();
	const mine = url.searchParams.get('mine') === '1';
	const dateFrom = url.searchParams.get('date_from') || '';
	const dateTo = url.searchParams.get('date_to') || '';

	let whereClauses: string[] = [];
	let params: any[] = [];

	if (status) {
		whereClauses.push('r.status = ?');
		params.push(status);
	}

	if (keyword) {
		whereClauses.push('(m.name LIKE ? OR m.phone LIKE ?)');
		params.push(`%${keyword}%`, `%${keyword}%`);
	}

	if (mine) {
		whereClauses.push('r.operator_id = ?');
		params.push(locals.user.id);
	}

	if (dateFrom) {
		whereClauses.push('date(r.created_at) >= date(?)');
		params.push(dateFrom);
	}

	if (dateTo) {
		whereClauses.push('date(r.created_at) <= date(?)');
		params.push(dateTo);
	}

	const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

	const recharges = db.prepare(`
		SELECT r.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
		FROM recharges r
		JOIN members m ON r.member_id = m.id
		JOIN users u ON r.operator_id = u.id
		LEFT JOIN users rv ON r.reviewer_id = rv.id
		${whereStr}
		ORDER BY r.created_at DESC
	`).all(...params);

	const todaySubmitCount = (db.prepare(`
		SELECT COUNT(*) as c FROM recharges WHERE date(created_at) = date('now', 'localtime')
	`).get() as any).c;

	const pendingCount = (db.prepare(`
		SELECT COUNT(*) as c FROM recharges WHERE status = 'pending'
	`).get() as any).c;

	const todayApprovedStats = db.prepare(`
		SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_amount
		FROM recharges WHERE status = 'approved' AND date(reviewed_at) = date('now', 'localtime')
	`).get() as any;

	const monthApprovedStats = db.prepare(`
		SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_amount
		FROM recharges WHERE status = 'approved'
		AND strftime('%Y-%m', reviewed_at) = strftime('%Y-%m', 'now', 'localtime')
	`).get() as any;

	let myPendingCount = 0;
	if (locals.user.role === 'admin') {
		myPendingCount = pendingCount;
	}

	return {
		recharges, currentStatus: status, currentKeyword: keyword,
		currentMine: mine, dateFrom, dateTo, user: locals.user,
		stats: {
			todaySubmitCount,
			pendingCount,
			todayApprovedCount: todayApprovedStats.cnt,
			todayApprovedAmount: todayApprovedStats.total_amount,
			monthApprovedCount: monthApprovedStats.cnt,
			monthApprovedAmount: monthApprovedStats.total_amount,
			myPendingCount
		}
	};
};

export const actions: Actions = {
	batch_approve: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];

		if (!ids.length) return fail(400, { error: '请至少选择一条记录' });

		const db = getDb();
		const getRecharge = db.prepare('SELECT * FROM recharges WHERE id = ? AND status = ?');

		db.transaction(() => {
			for (const id of ids) {
				const recharge = getRecharge.get(id, 'pending') as any;
				if (!recharge) continue;

				db.prepare(`
					UPDATE recharges SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user!.id, id);

				db.prepare(`
					UPDATE members SET balance = balance + ?
					WHERE id = ?
				`).run(recharge.amount, recharge.member_id);

				addLog('recharge', Number(id), 'approve', locals.user!.id,
					`批量审核通过，余额+${recharge.amount}元`);

				if (recharge.bonus_minutes > 0) {
					db.prepare(`
						UPDATE time_gifts SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
						WHERE recharge_id = ? AND status = 'pending'
					`).run(locals.user!.id, id);

					db.prepare(`
						UPDATE members SET bonus_minutes = bonus_minutes + ?
						WHERE id = ?
					`).run(recharge.bonus_minutes, recharge.member_id);

					const linkedGift = db.prepare('SELECT id FROM time_gifts WHERE recharge_id = ?').get(id) as any;
					if (linkedGift) {
						addLog('time_gift', linkedGift.id, 'approve', locals.user!.id,
							`随充值单#${id}批量复核通过，赠送时长+${recharge.bonus_minutes}分钟`);
					}
				}
			}
		})();

		throw redirect(302, '/recharges?status=pending');
	},

	batch_reject: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];
		const note = (formData.get('batch_reject_note') as string || '').trim();

		if (!ids.length) return fail(400, { error: '请至少选择一条记录' });
		if (!note) return fail(400, { error: '批量退回时必须填写原因' });

		const db = getDb();
		const getRecharge = db.prepare('SELECT * FROM recharges WHERE id = ? AND status = ?');

		db.transaction(() => {
			for (const id of ids) {
				const recharge = getRecharge.get(id, 'pending') as any;
				if (!recharge) continue;

				db.prepare(`
					UPDATE recharges SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user.id, note, id);

				addLog('recharge', Number(id), 'reject', locals.user.id,
					`批量退回，原因：${note}`);

				const linkedGift = db.prepare('SELECT id FROM time_gifts WHERE recharge_id = ? AND status = ?').get(id, 'pending') as any;
				if (linkedGift) {
					db.prepare(`
						UPDATE time_gifts SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
						WHERE id = ?
					`).run(locals.user.id, `充值单已批量退回，关联赠送自动退回`, linkedGift.id);

					addLog('time_gift', linkedGift.id, 'reject', locals.user.id,
						`复核不通过：充值单已批量退回，关联赠送自动退回`);
				}
			}
		})();

		throw redirect(302, '/recharges?status=pending');
	}
};
