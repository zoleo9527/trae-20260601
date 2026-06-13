import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const id = parseInt(params.id);
	const data = await request.json();

	const riskAlert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(id) as any;
	if (!riskAlert) {
		return json({ error: '风险提示不存在' }, { status: 404 });
	}

	db.prepare(`
		INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
		VALUES (?, ?, ?, ?)
	`).run(id, session.userId, data.action, data.description);

	if (data.action === '开始处理') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('processing', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从pending变更为processing', 'pending', 'processing');
	}

	if (data.action === '完成处理') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirming', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从processing变更为confirming', 'processing', 'confirming');
	}

	if (data.action === '确认完成') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从confirming变更为completed', 'confirming', 'completed');
	}

	return json({ success: true });
};