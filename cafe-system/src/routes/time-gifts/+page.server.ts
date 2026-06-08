import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const status = url.searchParams.get('status') || '';
	const keyword = (url.searchParams.get('keyword') || '').trim();
	const mine = url.searchParams.get('mine') === '1';

	let whereClauses: string[] = [];
	let params: any[] = [];

	if (status) {
		whereClauses.push('tg.status = ?');
		params.push(status);
	}

	if (keyword) {
		whereClauses.push('(m.name LIKE ? OR m.phone LIKE ?)');
		params.push(`%${keyword}%`, `%${keyword}%`);
	}

	if (mine) {
		whereClauses.push('tg.operator_id = ?');
		params.push(locals.user.id);
	}

	const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

	const timeGifts = db.prepare(`
		SELECT tg.*, m.name as member_name, u.display_name as operator_name, rv.display_name as reviewer_name
		FROM time_gifts tg
		JOIN members m ON tg.member_id = m.id
		JOIN users u ON tg.operator_id = u.id
		LEFT JOIN users rv ON tg.reviewer_id = rv.id
		${whereStr}
		ORDER BY tg.created_at DESC
	`).all(...params);

	return { timeGifts, currentStatus: status, currentKeyword: keyword, currentMine: mine, user: locals.user };
};

export const actions: Actions = {
	batch_approve: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];

		if (!ids.length) return fail(400, { error: '请至少选择一条记录' });

		const db = getDb();
		const getGift = db.prepare('SELECT * FROM time_gifts WHERE id = ? AND status = ?');

		db.transaction(() => {
			for (const id of ids) {
				const gift = getGift.get(id, 'pending') as any;
				if (!gift) continue;

				db.prepare(`
					UPDATE time_gifts SET status = 'approved', reviewer_id = ?, reviewed_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user!.id, id);

				db.prepare(`
					UPDATE members SET bonus_minutes = bonus_minutes + ?
					WHERE id = ?
				`).run(gift.minutes, gift.member_id);

				addLog('time_gift', Number(id), 'approve', locals.user!.id,
					`批量复核通过，赠送时长+${gift.minutes}分钟`);
			}
		})();

		throw redirect(302, '/time-gifts?status=pending');
	},

	batch_reject: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];
		const note = (formData.get('batch_reject_note') as string || '').trim();

		if (!ids.length) return fail(400, { error: '请至少选择一条记录' });
		if (!note) return fail(400, { error: '批量退回时必须填写原因' });

		const db = getDb();
		const getGift = db.prepare('SELECT * FROM time_gifts WHERE id = ? AND status = ?');

		db.transaction(() => {
			for (const id of ids) {
				const gift = getGift.get(id, 'pending') as any;
				if (!gift) continue;

				db.prepare(`
					UPDATE time_gifts SET status = 'rejected', reviewer_id = ?, review_note = ?, reviewed_at = datetime('now', 'localtime')
					WHERE id = ?
				`).run(locals.user.id, note, id);

				addLog('time_gift', Number(id), 'reject', locals.user.id,
					`批量复核不通过，原因：${note}`);
			}
		})();

		throw redirect(302, '/time-gifts?status=pending');
	}
};
