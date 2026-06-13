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
	const userId = session.userId;
	const id = parseInt(params.id);
	const data = await request.json();

	const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
	if (!['project_manager', 'tax_advisor'].includes(user?.role)) {
		return json({ error: '只有项目经理或税务顾问可以添加跟踪' }, { status: 403 });
	}

	const userTodo = db.prepare(`
		SELECT * FROM todo_items 
		WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'follow_up' AND status IN ('pending', 'processing')
		ORDER BY created_at DESC LIMIT 1
	`).get(id, userId) as any;

	if (!userTodo) {
		return json({ error: '您没有后续跟踪的待办' }, { status: 403 });
	}

	const result = db.prepare(`
		INSERT INTO follow_ups (risk_alert_id, follow_date, result, note)
		VALUES (?, ?, ?, ?)
	`).run(id, data.follow_date, data.result, data.note);

	db.prepare(`
		INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
		VALUES (?, ?, '添加跟踪记录', ?)
	`).run(id, userId, `跟踪结果：${data.result}，备注：${data.note || '无'}`);

	db.prepare(`
		UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
		WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'follow_up' AND status IN ('pending', 'processing')
	`).run(id, userId);

	if (data.result === 'resolved') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('closed', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从completed变更为closed', 'completed', 'closed');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND todo_type = 'sign_receive' AND status IN ('pending', 'processing')
		`).run(id);
	} else if (data.result === 'pending' || data.result === 'escalated') {
		const existingFollowUpTodo = db.prepare(`
			SELECT id FROM todo_items 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'follow_up' AND status IN ('pending', 'processing')
		`).get(id, userId);
		
		if (!existingFollowUpTodo) {
			db.prepare(`
				INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
				VALUES (?, ?, 'follow_up', 'pending', 'low')
			`).run(id, userId);
		}
	}

	return json({ id: result.lastInsertRowid });
};