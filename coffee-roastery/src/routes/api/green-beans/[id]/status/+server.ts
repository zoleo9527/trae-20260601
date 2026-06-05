import { updateGreenBeanStatus } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const { status } = await request.json();
	const validStatuses = ['pending_inspection', 'inspected', 'stored', 'exception'];
	if (!validStatuses.includes(status)) {
		return json({ error: '无效状态' }, { status: 400 });
	}
	updateGreenBeanStatus(Number(params.id), status, locals.user.id);
	return json({ ok: true });
};
