import { createRoastBatch } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	if (locals.user.role !== 'roaster') return json({ error: '仅烘焙师可创建烘焙批次' }, { status: 403 });
	const data = await request.json();
	try {
		const result = createRoastBatch({
			roasting_plan_id: data.roasting_plan_id,
			green_bean_id: data.green_bean_id,
			roaster_id: locals.user.id,
			actual_roast_level: data.actual_roast_level,
			start_time: data.start_time,
			input_weight_kg: data.input_weight_kg,
			notes: data.notes || ''
		});
		return json({ ok: true, ...result });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
