import { getRoastingPlan, getTimeline, getExceptions, getRoastBatches, getDb } from '$lib/db.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const plan = getRoastingPlan(Number(params.id));
	if (!plan) throw error(404, '烘焙计划不存在');
	const timeline = getTimeline('roasting_plan', plan.id);
	const exceptions = getExceptions({ entity_type: 'roasting_plan', entity_id: plan.id });
	const batches = getRoastBatches(plan.id);
	const db = getDb();
	const roasters = db.prepare("SELECT id, display_name FROM users WHERE role = 'roaster'").all();
	return { plan, timeline, exceptions, batches, roasters, user: locals.user };
};
