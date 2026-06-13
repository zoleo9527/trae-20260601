import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');
	if (!sessionCookie) {
		return json({ error: '未登录' }, { status: 401 });
	}

	const total = db.prepare('SELECT COUNT(*) as count FROM risk_alerts').get() as { count: number };
	const pending = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('pending') as { count: number };
	const processing = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('processing') as { count: number };
	const confirming = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('confirming') as { count: number };
	const completed = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('completed') as { count: number };
	const closed = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('closed') as { count: number };

	const high = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?').get('high') as { count: number };
	const medium = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?').get('medium') as { count: number };
	const low = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?').get('low') as { count: number };

	const typeStats = db.prepare('SELECT type, COUNT(*) as count FROM risk_alerts GROUP BY type').all() as any[];
	const byType: Record<string, number> = {};
	typeStats.forEach(stat => {
		byType[stat.type] = stat.count;
	});

	return json({
		total: total.count,
		pending: pending.count,
		processing: processing.count,
		confirming: confirming.count,
		completed: completed.count,
		closed: closed.count,
		bySeverity: {
			high: high.count,
			medium: medium.count,
			low: low.count
		},
		byType
	});
};