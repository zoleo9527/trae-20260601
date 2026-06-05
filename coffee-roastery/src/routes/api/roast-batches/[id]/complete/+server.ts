import { completeRoastBatch } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	if (locals.user.role !== 'roaster') return json({ error: '仅烘焙师可完结批次' }, { status: 403 });

	const { end_time, output_weight_kg, notes } = await request.json();
	if (!end_time || !output_weight_kg) {
		return json({ error: '请填写结束时间和产出重量' }, { status: 400 });
	}

	try {
		const result = completeRoastBatch(
			Number(params.id),
			end_time,
			parseFloat(output_weight_kg),
			notes || ''
		);
		if (!result) {
			return json({ error: '批次不存在或已完结' }, { status: 400 });
		}
		return json({ ok: true, ...result });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
