import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	const followUps = db.prepare('SELECT * FROM follow_ups WHERE risk_alert_id = ? ORDER BY follow_date DESC').all(id);
	return json({ data: followUps });
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const id = parseInt(params.id);
	const data = await request.json();

	const result = db.prepare(`
		INSERT INTO follow_ups (risk_alert_id, follow_date, result, note)
		VALUES (?, ?, ?, ?)
	`).run(id, data.follow_date, data.result, data.note);

	db.prepare(`
		INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
		VALUES (?, ?, '添加跟踪记录', ?)
	`).run(id, session.userId, `跟踪结果：${data.result}，备注：${data.note || '无'}`);

	if (data.result === 'resolved') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('closed', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从completed变更为closed', 'completed', 'closed');
	}

	return json({ id: result.lastInsertRowid });
};