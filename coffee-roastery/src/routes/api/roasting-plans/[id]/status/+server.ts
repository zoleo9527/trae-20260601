import { updateRoastingPlanStatus } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const { status } = await request.json();
	const validStatuses = ['planned', 'approved', 'in_progress', 'completed', 'cancelled'];
	if (!validStatuses.includes(status)) {
		return json({ error: '无效状态' }, { status: 400 });
	}
	updateRoastingPlanStatus(Number(params.id), status, locals.user.id);
	return json({ ok: true });
};
