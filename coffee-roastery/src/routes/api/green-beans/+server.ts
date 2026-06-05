import { createGreenBean, addTimelineEvent } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const data = await request.json();

	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const db = (await import('$lib/db.js')).getDb();
	const count = (db.prepare("SELECT COUNT(*) as c FROM green_beans WHERE created_at >= date('now')").get() as { c: number }).c;
	const batch_no = `GB-${today}-${String(count + 1).padStart(3, '0')}`;

	try {
		const id = createGreenBean({
			batch_no,
			name: data.name,
			origin: data.origin,
			variety: data.variety,
			process: data.process || '水洗',
			weight_kg: data.weight_kg,
			remaining_kg: data.remaining_kg || data.weight_kg,
			bag_count: data.bag_count || 1,
			supplier: data.supplier,
			contract_no: data.contract_no || '',
			arrival_date: data.arrival_date,
			warehouse_location: data.warehouse_location || '',
			moisture_content: data.moisture_content || null,
			density: data.density || null,
			screen_size: data.screen_size || null,
			notes: data.notes || '',
			status: 'pending_inspection',
			created_by: locals.user.id
		});

		addTimelineEvent('green_bean', Number(id), 'created', `生豆入库登记完成，批次号: ${batch_no}`, locals.user.id);

		return json({ ok: true, id, batch_no });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
