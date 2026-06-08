import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const tournament = db.prepare(`
		SELECT t.*, u.display_name as operator_name
		FROM tournaments t
		JOIN users u ON t.operator_id = u.id
		WHERE t.id = ?
	`).get(params.id) as any;

	if (!tournament) throw redirect(302, '/tournaments');

	const registrations = db.prepare(`
		SELECT tr.*, m.name as member_name
		FROM tournament_registrations tr
		JOIN members m ON tr.member_id = m.id
		WHERE tr.tournament_id = ?
		ORDER BY tr.registered_at
	`).all(params.id);

	const members = db.prepare('SELECT id, name FROM members ORDER BY name').all();

	return { tournament, registrations, members, user: locals.user };
};

export const actions: Actions = {
	register: async ({ locals, params, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const member_id = Number(formData.get('member_id'));

		const db = getDb();
		const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(params.id) as any;
		if (!tournament) return fail(400, { error: '赛事不存在' });

		const count = (db.prepare('SELECT COUNT(*) as c FROM tournament_registrations WHERE tournament_id = ?').get(params.id) as { c: number }).c;
		if (count >= tournament.max_participants) {
			return fail(400, { error: '赛事人数已满' });
		}

		const existing = db.prepare('SELECT id FROM tournament_registrations WHERE tournament_id = ? AND member_id = ?').get(params.id, member_id);
		if (existing) {
			return fail(400, { error: '该会员已报名' });
		}

		const member = db.prepare('SELECT name FROM members WHERE id = ?').get(member_id) as any;
		if (!member) return fail(400, { error: '会员不存在' });

		const result = db.prepare(`
			INSERT INTO tournament_registrations (tournament_id, member_id, registered_by, status)
			VALUES (?, ?, ?, 'registered')
		`).run(Number(params.id), member_id, locals.user.id);

		addLog('tournament_reg', Number(result.lastInsertRowid), 'register', locals.user.id,
			`会员${member.name}报名${tournament.name}`);

		throw redirect(302, `/tournaments/${params.id}`);
	},

	checkin: async ({ locals, params, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const reg_id = Number(formData.get('reg_id'));

		const db = getDb();
		const reg = db.prepare('SELECT tr.*, m.name as member_name FROM tournament_registrations tr JOIN members m ON tr.member_id = m.id WHERE tr.id = ?').get(reg_id) as any;
		if (!reg || reg.status !== 'registered') {
			return fail(400, { error: '无法签到' });
		}

		db.prepare("UPDATE tournament_registrations SET status = 'checked_in' WHERE id = ?").run(reg_id);

		const tournament = db.prepare('SELECT name FROM tournaments WHERE id = ?').get(params.id) as any;
		addLog('tournament_reg', reg_id, 'checkin', locals.user.id,
			`会员${reg.member_name}签到${tournament?.name || '赛事'}`);

		throw redirect(302, `/tournaments/${params.id}`);
	},

	eliminate: async ({ locals, params, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const reg_id = Number(formData.get('reg_id'));

		const db = getDb();
		const reg = db.prepare('SELECT tr.*, m.name as member_name FROM tournament_registrations tr JOIN members m ON tr.member_id = m.id WHERE tr.id = ?').get(reg_id) as any;
		if (!reg || reg.status !== 'checked_in') {
			return fail(400, { error: '无法淘汰' });
		}

		db.prepare("UPDATE tournament_registrations SET status = 'eliminated' WHERE id = ?").run(reg_id);

		const tournament = db.prepare('SELECT name FROM tournaments WHERE id = ?').get(params.id) as any;
		addLog('tournament_reg', reg_id, 'eliminate', locals.user.id,
			`会员${reg.member_name}在${tournament?.name || '赛事'}中被淘汰`);

		throw redirect(302, `/tournaments/${params.id}`);
	},

	win: async ({ locals, params, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const reg_id = Number(formData.get('reg_id'));

		const db = getDb();
		const reg = db.prepare('SELECT tr.*, m.name as member_name FROM tournament_registrations tr JOIN members m ON tr.member_id = m.id WHERE tr.id = ?').get(reg_id) as any;
		if (!reg || reg.status !== 'checked_in') {
			return fail(400, { error: '无法设为冠军' });
		}

		db.prepare("UPDATE tournament_registrations SET status = 'won' WHERE id = ?").run(reg_id);

		const tournament = db.prepare('SELECT name FROM tournaments WHERE id = ?').get(params.id) as any;
		addLog('tournament_reg', reg_id, 'win', locals.user.id,
			`会员${reg.member_name}获得${tournament?.name || '赛事'}冠军`);

		throw redirect(302, `/tournaments/${params.id}`);
	},

	update_status: async ({ locals, params, request }) => {
		if (!locals.user || !['tournament', 'admin'].includes(locals.user.role)) {
			throw redirect(302, '/dashboard');
		}

		const formData = await request.formData();
		const new_status = formData.get('new_status') as string;

		const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
		if (!validStatuses.includes(new_status)) {
			return fail(400, { error: '无效的赛事状态' });
		}

		const db = getDb();
		const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(params.id) as any;
		if (!tournament) return fail(400, { error: '赛事不存在' });

		db.prepare('UPDATE tournaments SET status = ? WHERE id = ?').run(new_status, params.id);

		const statusLabels: Record<string, string> = { upcoming: '未开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消' };
		addLog('tournament', Number(params.id), 'update_status', locals.user.id,
			`赛事${tournament.name}状态变更为${statusLabels[new_status]}`);

		throw redirect(302, `/tournaments/${params.id}`);
	}
};
