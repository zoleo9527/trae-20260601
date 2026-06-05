import { createCuppingRecord } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	if (locals.user.role !== 'cupper') return json({ error: '仅杯测员可创建杯测记录' }, { status: 403 });
	const data = await request.json();
	try {
		const id = createCuppingRecord({
			roast_batch_id: data.roast_batch_id,
			cupper_id: locals.user.id,
			aroma_score: data.aroma_score,
			flavor_score: data.flavor_score,
			aftertaste_score: data.aftertaste_score,
			acidity_score: data.acidity_score,
			body_score: data.body_score,
			balance_score: data.balance_score,
			overall_score: data.overall_score,
			notes: data.notes || ''
		});
		return json({ ok: true, id });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
