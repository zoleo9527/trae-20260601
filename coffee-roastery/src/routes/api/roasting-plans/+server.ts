import { createRoastingPlan } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const data = await request.json();
	try {
		const result = createRoastingPlan({
			green_bean_id: data.green_bean_id,
			plan_date: data.plan_date,
			target_roast_level: data.target_roast_level,
			batch_size_kg: data.batch_size_kg,
			expected_output_kg: data.expected_output_kg,
			priority: data.priority || 'normal',
			assigned_roaster: data.assigned_roaster || null,
			notes: data.notes || '',
			created_by: locals.user.id
		});
		return json({ ok: true, ...result });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
