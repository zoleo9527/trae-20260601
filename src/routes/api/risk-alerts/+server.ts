import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RiskAlert, User } from '$lib/types';

function generateCode(): string {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
	const count = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE code LIKE ?').get(`RF-${dateStr}%`) as { count: number };
	return `RF-${dateStr}-${String(count.count + 1).padStart(3, '0')}`;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const status = url.searchParams.get('status');
	const type = url.searchParams.get('type');
	const severity = url.searchParams.get('severity');
	const assignee = url.searchParams.get('assignee');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	let query = `
		SELECT ra.*, u.name as assignee_name, c.name as creator_name
		FROM risk_alerts ra
		LEFT JOIN users u ON ra.assignee_id = u.id
		LEFT JOIN users c ON ra.creator_id = c.id
		WHERE 1=1
	`;
	const params: any[] = [];

	if (status) {
		query += ' AND ra.status = ?';
		params.push(status);
	}
	if (type) {
		query += ' AND ra.type = ?';
		params.push(type);
	}
	if (severity) {
		query += ' AND ra.severity = ?';
		params.push(severity);
	}
	if (assignee) {
		query += ' AND ra.assignee_id = ?';
		params.push(parseInt(assignee));
	}

	query += ' ORDER BY ra.created_at DESC LIMIT ? OFFSET ?';
	params.push(limit);
	params.push((page - 1) * limit);

	const riskAlerts = db.prepare(query).all(...params) as any[];

	const alertsWithLogs = riskAlerts.map(alert => {
		const recentLogs = db.prepare(`
			SELECT ol.*, u.name as user_name
			FROM operation_logs ol
			LEFT JOIN users u ON ol.user_id = u.id
			WHERE ol.risk_alert_id = ?
			ORDER BY ol.created_at DESC
			LIMIT 3
		`).all(alert.id) as any[];
		
		return {
			...alert,
			recentLogs
		};
	});

	const countQuery = 'SELECT COUNT(*) as total FROM risk_alerts WHERE 1=1';
	const countParams: any[] = [];
	let countQueryWithFilters = countQuery;
	
	if (status) {
		countQueryWithFilters += ' AND status = ?';
		countParams.push(status);
	}
	if (type) {
		countQueryWithFilters += ' AND type = ?';
		countParams.push(type);
	}
	if (severity) {
		countQueryWithFilters += ' AND severity = ?';
		countParams.push(severity);
	}
	if (assignee) {
		countQueryWithFilters += ' AND assignee_id = ?';
		countParams.push(parseInt(assignee));
	}

	const totalResult = db.prepare(countQueryWithFilters).get(...countParams) as { total: number };

	return json({
		data: alertsWithLogs,
		total: totalResult.total,
		page
	});
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const session = JSON.parse(sessionCookie);
	const data = await request.json();
	const code = generateCode();

	const stmt = db.prepare(`
		INSERT INTO risk_alerts (code, title, type, severity, status, assignee_id, creator_id, related_type, related_id, due_date)
		VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
	`);

	const result = stmt.run(
		code,
		data.title,
		data.type,
		data.severity,
		data.assignee_id,
		session.userId,
		data.related_type,
		data.related_id,
		data.due_date
	);

	db.prepare(`
		INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value)
		VALUES (?, ?, '创建风险提示', ?, NULL, 'pending')
	`).run(result.lastInsertRowid, session.userId, `创建风险提示：${data.title}`);

	if (data.assignee_id) {
		db.prepare(`
			INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority)
			VALUES (?, ?, 'risk_process', 'pending', ?)
		`).run(result.lastInsertRowid, data.assignee_id, data.severity);
	}

	return json({ id: result.lastInsertRowid, code });
};