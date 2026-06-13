import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const userId = url.searchParams.get('user_id') || session.userId;
	const status = url.searchParams.get('status');
	const type = url.searchParams.get('type');

	let query = `
		SELECT ti.*, ra.code, ra.title, ra.type, ra.severity, ra.status as risk_status, u.name as user_name
		FROM todo_items ti
		LEFT JOIN risk_alerts ra ON ti.risk_alert_id = ra.id
		LEFT JOIN users u ON ti.user_id = u.id
		WHERE ti.user_id = ?
	`;
	const params: any[] = [parseInt(userId)];

	if (status) {
		query += ' AND ti.status = ?';
		params.push(status);
	}
	if (type) {
		query += ' AND ti.todo_type = ?';
		params.push(type);
	}

	query += ' ORDER BY ti.created_at DESC';

	const todos = db.prepare(query).all(...params);

	return json({ data: todos });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const data = await request.json();

	const result = db.prepare(`
		INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
		VALUES (?, ?, ?, 'pending', ?)
	`).run(data.risk_alert_id, data.user_id, data.todo_type, data.priority);

	return json({ id: result.lastInsertRowid });
};