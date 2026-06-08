import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const tournaments = db.prepare(`
		SELECT t.*, u.display_name as operator_name,
			(SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as participant_count
		FROM tournaments t
		JOIN users u ON t.operator_id = u.id
		ORDER BY t.start_time DESC
	`).all();

	return { tournaments, user: locals.user };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const game = formData.get('game') as string;
		const start_time = formData.get('start_time') as string;
		const max_participants = Number(formData.get('max_participants'));
		const prize_minutes = Number(formData.get('prize_minutes'));

		if (!name?.trim() || !game?.trim() || !start_time) {
			return fail(400, { error: '请填写完整的赛事信息' });
		}

		const db = getDb();
		const result = db.prepare(`
			INSERT INTO tournaments (name, game, start_time, status, max_participants, prize_minutes, operator_id)
			VALUES (?, ?, ?, 'upcoming', ?, ?, ?)
		`).run(name.trim(), game.trim(), start_time.replace('T', ' '), max_participants || 32, prize_minutes || 0, locals.user.id);

		addLog('tournament', Number(result.lastInsertRowid), 'create', locals.user.id,
			`创建赛事：${name.trim()}（${game.trim()}），冠军奖励${prize_minutes || 0}分钟`);

		throw redirect(302, '/tournaments');
	}
};
