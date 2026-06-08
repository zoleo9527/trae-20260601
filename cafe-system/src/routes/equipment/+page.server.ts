import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const repairs = db.prepare(`
		SELECT er.*, u1.display_name as reporter_name, u2.display_name as assignee_name
		FROM equipment_repairs er
		JOIN users u1 ON er.reported_by = u1.id
		LEFT JOIN users u2 ON er.assigned_to = u2.id
		ORDER BY er.created_at DESC
	`).all();

	const operators = db.prepare(
		"SELECT id, display_name FROM users WHERE role = 'operator'"
	).all();

	return { repairs, operators, user: locals.user };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const computerId = formData.get('computer_id') as string;
		const issue = formData.get('issue') as string;

		if (!computerId?.trim() || !issue?.trim()) {
			return fail(400, { error: '请填写机位号和故障描述' });
		}

		const db = getDb();
		const result = db.prepare(`
			INSERT INTO equipment_repairs (computer_id, issue, reported_by, status)
			VALUES (?, ?, ?, 'reported')
		`).run(computerId.trim(), issue.trim(), locals.user.id);

		addLog('equipment', Number(result.lastInsertRowid), 'create', locals.user.id,
			`报修机位${computerId.trim()}：${issue.trim()}`);

		throw redirect(302, '/equipment');
	},

	assign: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const assignedTo = Number(formData.get('assigned_to'));

		if (!id || !assignedTo) {
			return fail(400, { error: '参数无效' });
		}

		const db = getDb();
		const repair = db.prepare('SELECT * FROM equipment_repairs WHERE id = ? AND status = ?').get(id, 'reported') as any;
		if (!repair) return fail(400, { error: '该报修单无法指派' });

		const assignee = db.prepare('SELECT * FROM users WHERE id = ?').get(assignedTo) as any;
		if (!assignee) return fail(400, { error: '指派用户不存在' });

		db.prepare(`
			UPDATE equipment_repairs SET assigned_to = ?, status = 'in_progress'
			WHERE id = ?
		`).run(assignedTo, id);

		addLog('equipment', id, 'assign', locals.user.id,
			`指派${assignee.display_name}处理机位${repair.computer_id}的维修`);

		throw redirect(302, '/equipment');
	},

	resolve: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const resolutionNote = formData.get('resolution_note') as string;

		if (!id || !resolutionNote?.trim()) {
			return fail(400, { error: '请填写修复说明' });
		}

		const db = getDb();
		const repair = db.prepare('SELECT * FROM equipment_repairs WHERE id = ? AND status = ?').get(id, 'in_progress') as any;
		if (!repair) return fail(400, { error: '该报修单无法修复' });

		if (locals.user.role !== 'admin' && repair.assigned_to !== locals.user.id) {
			return fail(403, { error: '无权操作' });
		}

		db.prepare(`
			UPDATE equipment_repairs SET status = 'resolved', resolved_at = datetime('now', 'localtime'), resolution_note = ?
			WHERE id = ?
		`).run(resolutionNote.trim(), id);

		addLog('equipment', id, 'resolve', locals.user.id,
			`已修复：${resolutionNote.trim()}`);

		throw redirect(302, '/equipment');
	}
};
