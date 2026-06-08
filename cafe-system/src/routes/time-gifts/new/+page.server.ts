import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'operator' && locals.user.role !== 'tournament' && locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const db = getDb();
	const members = db.prepare('SELECT id, name, phone, balance, bonus_minutes FROM members ORDER BY name').all();

	let tournaments: any[] = [];
	if (locals.user.role === 'tournament') {
		tournaments = db.prepare('SELECT id, name, game, status FROM tournaments WHERE operator_id = ? ORDER BY start_time DESC').all(locals.user.id);
	} else {
		tournaments = db.prepare('SELECT id, name, game, status FROM tournaments ORDER BY start_time DESC').all();
	}

	return { members, tournaments, user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const memberId = Number(formData.get('member_id'));
		const minutes = Number(formData.get('minutes'));
		const reason = formData.get('reason') as string;
		const sourceType = formData.get('source_type') as string;
		const sourceId = formData.get('source_id') as string;

		if (!memberId || !minutes || minutes <= 0) {
			return fail(400, { error: '请选择会员并输入有效时长' });
		}
		if (!reason?.trim()) {
			return fail(400, { error: '请填写赠送原因' });
		}

		const db = getDb();
		const result = db.prepare(`
			INSERT INTO time_gifts (member_id, minutes, reason, source_type, source_id, status, operator_id)
			VALUES (?, ?, ?, ?, ?, 'pending', ?)
		`).run(
			memberId, minutes, reason.trim(), sourceType || 'manual',
			sourceId ? Number(sourceId) : null, locals.user.id
		);

		addLog('time_gift', Number(result.lastInsertRowid), 'create', locals.user.id,
			`提交时长赠送：${minutes}分钟，原因：${reason.trim()}，来源：${sourceType === 'tournament' ? '赛事' : sourceType === 'promotion' ? '活动' : '手动'}`);

		throw redirect(302, `/time-gifts/${result.lastInsertRowid}`);
	}
};
