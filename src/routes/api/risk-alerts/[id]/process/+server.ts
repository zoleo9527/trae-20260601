import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const userId = session.userId;
	const id = parseInt(params.id);
	const data = await request.json();

	const riskAlert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(id) as any;
	if (!riskAlert) {
		return json({ error: '风险提示不存在' }, { status: 404 });
	}

	const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
	if (!user) {
		return json({ error: '用户不存在' }, { status: 404 });
	}

	db.prepare(`
		INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
		VALUES (?, ?, ?, ?)
	`).run(id, userId, data.action, data.description);

	if (data.action === '开始处理') {
		if (user.role !== 'tax_advisor' && userId !== riskAlert.assignee_id) {
			return json({ error: '只有税务顾问或责任人可以开始处理' }, { status: 403 });
		}
		
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('processing', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从pending变更为processing', 'pending', 'processing');
		
		db.prepare(`
			UPDATE todo_items SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'risk_process' AND status = 'pending'
		`).run(id, userId);
	}

	if (data.action === '完成处理') {
		if (user.role !== 'tax_advisor' && userId !== riskAlert.assignee_id) {
			return json({ error: '只有税务顾问或责任人可以完成处理' }, { status: 403 });
		}
		
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirming', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从processing变更为confirming', 'processing', 'confirming');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'risk_process' AND status IN ('pending', 'processing')
		`).run(id, userId);
		
		const existingReviewTodo = db.prepare(`
			SELECT id FROM todo_items 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'review_confirm' AND status IN ('pending', 'processing')
		`).get(id, riskAlert.creator_id);
		
		if (!existingReviewTodo) {
			db.prepare(`
				INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
				VALUES (?, ?, 'review_confirm', 'pending', ?)
			`).run(id, riskAlert.creator_id, riskAlert.severity);
		}
	}

	if (data.action === '确认完成') {
		if (user.role !== 'project_manager' && userId !== riskAlert.creator_id) {
			return json({ error: '只有项目经理或创建人可以确认完成' }, { status: 403 });
		}
		
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从confirming变更为completed', 'confirming', 'completed');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'review_confirm' AND status IN ('pending', 'processing')
		`).run(id, userId);
	}

	if (data.action === '退回补充') {
		if (user.role !== 'project_manager' && userId !== riskAlert.creator_id) {
			return json({ error: '只有项目经理或创建人可以退回补充' }, { status: 403 });
		}
		
		const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
		const values: any[] = ['processing'];
		
		if (data.reject_reason) {
			updates.push('reject_reason = ?');
			values.push(data.reject_reason);
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '填写退回原因', ?)
			`).run(id, userId, data.reject_reason);
		}
		
		if (data.supplement_note) {
			updates.push('supplement_note = ?');
			values.push(data.supplement_note);
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '添加补充备注', ?)
			`).run(id, userId, data.supplement_note);
		}
		
		values.push(id);
		db.prepare(`UPDATE risk_alerts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
		
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从confirming变更为processing', 'confirming', 'processing');
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'review_confirm' AND status IN ('pending', 'processing')
		`).run(id, userId);
		
		const existingProcessTodo = db.prepare(`
			SELECT id FROM todo_items 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'risk_process' AND status IN ('pending', 'processing')
		`).get(id, riskAlert.assignee_id);
		
		if (!existingProcessTodo) {
			db.prepare(`
				INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
				VALUES (?, ?, 'risk_process', 'pending', ?)
			`).run(id, riskAlert.assignee_id, riskAlert.severity);
		}
	}

	if (data.action === '补充资料') {
		if (user.role !== 'client_finance') {
			return json({ error: '只有客户财务可以补充资料' }, { status: 403 });
		}
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'supplement_docs' AND status IN ('pending', 'processing')
		`).run(id, userId);
		
		if (data.supplement_note) {
			db.prepare('UPDATE risk_alerts SET supplement_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.supplement_note, id);
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '添加补充备注', ?)
			`).run(id, userId, data.supplement_note);
		}
	}

	if (data.action === '签收确认') {
		if (user.role !== 'client_finance') {
			return json({ error: '只有客户财务可以签收确认' }, { status: 403 });
		}
		
		db.prepare(`
			UPDATE todo_items SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'sign_receive' AND status IN ('pending', 'processing')
		`).run(id, userId);
	}

	if (data.action === '添加跟踪') {
		if (!['project_manager', 'tax_advisor'].includes(user.role)) {
			return json({ error: '只有项目经理或税务顾问可以添加跟踪' }, { status: 403 });
		}
		
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

	if (data.action === '重新处理') {
		if (user.role !== 'project_manager' && user.role !== 'tax_advisor') {
			return json({ error: '只有项目经理或税务顾问可以重新处理' }, { status: 403 });
		}
		
		db.prepare('UPDATE risk_alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('processing', id);
		db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
			VALUES (?, ?, '状态变更', ?, ?, ?)
		`).run(id, userId, '状态从completed变更为processing', 'completed', 'processing');
		
		const existingProcessTodo = db.prepare(`
			SELECT id FROM todo_items 
			WHERE risk_alert_id = ? AND user_id = ? AND todo_type = 'risk_process' AND status IN ('pending', 'processing')
		`).get(id, riskAlert.assignee_id);
		
		if (!existingProcessTodo) {
			db.prepare(`
				INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
				VALUES (?, ?, 'risk_process', 'pending', ?)
			`).run(id, riskAlert.assignee_id, riskAlert.severity);
		}
	}

	return json({ success: true });
};
