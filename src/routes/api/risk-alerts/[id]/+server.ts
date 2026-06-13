import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RiskAlertDetail } from '$lib/types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const userId = session.userId;
	const id = parseInt(params.id);

	const riskAlert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(id) as any;
	if (!riskAlert) {
		return json({ error: '风险提示不存在' }, { status: 404 });
	}

	const todos = db.prepare(`
		SELECT * FROM todo_items 
		WHERE risk_alert_id = ? AND user_id = ? AND status IN ('pending', 'processing')
	`).all(id, userId) as any[];

	const followUps = db.prepare('SELECT * FROM follow_ups WHERE risk_alert_id = ? ORDER BY follow_date DESC').all(id) as any[];
	const operationLogs = db.prepare('SELECT ol.*, u.name as user_name FROM operation_logs ol LEFT JOIN users u ON ol.user_id = u.id WHERE ol.risk_alert_id = ? ORDER BY ol.created_at DESC').all(id) as any[];

	const assignee = riskAlert.assignee_id ? db.prepare('SELECT id, username, role, name, email FROM users WHERE id = ?').get(riskAlert.assignee_id) as any : null;
	const creator = riskAlert.creator_id ? db.prepare('SELECT id, username, role, name, email FROM users WHERE id = ?').get(riskAlert.creator_id) as any : null;

	return json({
		riskAlert,
		todos,
		followUps,
		operationLogs,
		assignee,
		creator
	} as RiskAlertDetail);
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const id = parseInt(params.id);
	const data = await request.json();

	const oldRiskAlert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(id) as any;
	if (!oldRiskAlert) {
		return json({ error: '风险提示不存在' }, { status: 404 });
	}

	const updates: string[] = [];
	const values: any[] = [];

	if (data.status) {
		updates.push('status = ?');
		values.push(data.status);
	}
	if (data.reject_reason) {
		updates.push('reject_reason = ?');
		values.push(data.reject_reason);
	}
	if (data.supplement_note) {
		updates.push('supplement_note = ?');
		values.push(data.supplement_note);
	}
	if (data.assignee_id) {
		updates.push('assignee_id = ?');
		values.push(data.assignee_id);
	}

	if (updates.length > 0) {
		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		db.prepare(`UPDATE risk_alerts SET ${updates.join(', ')} WHERE id = ?`).run(...values);

		if (data.status && data.status !== oldRiskAlert.status) {
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
				VALUES (?, ?, '状态变更', ?, ?, ?)
			`).run(id, session.userId, `状态从${oldRiskAlert.status}变更为${data.status}`, oldRiskAlert.status, data.status);
		}

		if (data.reject_reason) {
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '填写退回原因', ?)
			`).run(id, session.userId, data.reject_reason);
		}

		if (data.supplement_note) {
			db.prepare(`
				INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
				VALUES (?, ?, '添加补充备注', ?)
			`).run(id, session.userId, data.supplement_note);
		}
	}

	return json({ success: true });
};
