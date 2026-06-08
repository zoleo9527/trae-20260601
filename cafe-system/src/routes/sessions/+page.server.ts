import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const sessions = db.prepare(`
		SELECT cs.*, m.name as member_name, u.display_name as operator_name
		FROM computer_sessions cs
		JOIN members m ON cs.member_id = m.id
		JOIN users u ON cs.operator_id = u.id
		ORDER BY cs.start_time DESC
	`).all();

	const members = db.prepare('SELECT id, name FROM members ORDER BY name').all();

	const activeComputerIds = (
		db.prepare('SELECT computer_id FROM computer_sessions WHERE end_time IS NULL').all() as { computer_id: string }[]
	).map((r) => r.computer_id);

	const allComputers: string[] = [];
	for (const zone of ['A', 'B', 'C']) {
		for (let i = 1; i <= 10; i++) {
			const id = `${zone}-${String(i).padStart(2, '0')}`;
			if (!activeComputerIds.includes(id)) {
				allComputers.push(id);
			}
		}
	}

	return { sessions, members, availableComputers: allComputers, user: locals.user };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const memberId = Number(formData.get('member_id'));
		const computerId = formData.get('computer_id') as string;

		if (!memberId || !computerId) {
			return fail(400, { error: '请选择会员和机位' });
		}

		const db = getDb();
		const result = db.prepare(
			"INSERT INTO computer_sessions (member_id, computer_id, start_time, operator_id) VALUES (?, ?, datetime('now', 'localtime'), ?)"
		).run(memberId, computerId, locals.user.id);

		addLog('session', Number(result.lastInsertRowid), 'create', locals.user.id, `会员上机，机位${computerId}`);

		throw redirect(302, '/sessions');
	},
	end: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const sessionId = Number(formData.get('id'));

		if (!sessionId) {
			return fail(400, { error: '参数无效' });
		}

		const db = getDb();
		const session = db.prepare('SELECT * FROM computer_sessions WHERE id = ?').get(sessionId) as any;
		if (!session || session.end_time) {
			return fail(400, { error: '该会话无法结束' });
		}

		const startTime = new Date(session.start_time.replace(' ', 'T'));
		const durationMinutes = Math.round((Date.now() - startTime.getTime()) / 60000);

		db.prepare(
			"UPDATE computer_sessions SET end_time = datetime('now', 'localtime'), duration_minutes = ? WHERE id = ?"
		).run(durationMinutes, sessionId);

		addLog('session', sessionId, 'end', locals.user.id, `会员下机，机位${session.computer_id}，时长${durationMinutes}分钟`);

		throw redirect(302, '/sessions');
	}
};
