import { getRoastingPlan, getTimeline, getExceptions, getRoastBatches, getDb, getCuppingRecords } from '$lib/db.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const plan = getRoastingPlan(Number(params.id));
	if (!plan) throw error(404, '烘焙计划不存在');
	const timeline = getTimeline('roasting_plan', plan.id);
	const exceptions = getExceptions({ entity_type: 'roasting_plan', entity_id: plan.id });
	const batches = getRoastBatches(plan.id);
	const batchIds = (batches as any[]).map(b => b.id);
	const db = getDb();
	const roasters = db.prepare("SELECT id, display_name FROM users WHERE role = 'roaster'").all();
	const allCuppings = batchIds.length > 0 ? getCuppingRecords() : [];
	const cuppingMap: Record<number, any[]> = {};
	for (const c of allCuppings as any[]) {
		if (batchIds.includes(c.roast_batch_id)) {
			if (!cuppingMap[c.roast_batch_id]) cuppingMap[c.roast_batch_id] = [];
			cuppingMap[c.roast_batch_id].push(c);
		}
	}
	return { plan, timeline, exceptions, batches, roasters, cuppingMap, user: locals.user };
};
