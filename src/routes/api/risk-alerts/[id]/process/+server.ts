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
		
		db.prepare(`
			UPDATE todo_items SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND todo_type = 'risk_process'
		`).run(id);
	}

	if (data.action === '完成处理') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirming', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从processing变更为confirming', 'processing', 'confirming');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND todo_type = 'risk_process'
		`).run(id);
		
		db.prepare(`
			INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
			SELECT ?, creator_id, 'review_confirm', 'pending', severity
			FROM risk_alerts WHERE id = ?
		`).run(id, id);
	}

	if (data.action === '确认完成') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从confirming变更为completed', 'confirming', 'completed');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND todo_type = 'review_confirm'
		`).run(id);
	}

	if (data.action === '退回补充') {
		const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
		const values: any[] = ['processing'];
		
		if (data.reject_reason) {
			updates.push('reject_reason = ?');
			values.push(data.reject_reason);
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '填写退回原因', ?)
			`).run(id, session.userId, data.reject_reason);
		}
		
		if (data.supplement_note) {
			updates.push('supplement_note = ?');
			values.push(data.supplement_note);
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '添加补充备注', ?)
			`).run(id, session.userId, data.supplement_note);
		}
		
		values.push(id);
		db.prepare(`UPDATE risk_alerts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
		
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从confirming变更为processing', 'confirming', 'processing');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND todo_type = 'review_confirm'
		`).run(id);
		
		db.prepare(`
			INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
			SELECT ?, assignee_id, 'risk_process', 'pending', severity
			FROM risk_alerts WHERE id = ?
		`).run(id, id);
	}

	if (data.action === '重新处理') {
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('processing', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, session.userId, '状态从completed变更为processing', 'completed', 'processing');
		
		db.prepare(`
			INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
			SELECT ?, assignee_id, 'risk_process', 'pending', severity
			FROM risk_alerts WHERE id = ?
		`).run(id, id);
	}

	return json({ success: true });
};
