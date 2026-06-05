import { getDb, getCuppingRecords } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const db = getDb();
	const batches = db.prepare(`
		SELECT rb.*, gb.name as green_bean_name, rp.plan_no
		FROM roast_batches rb
		LEFT JOIN green_beans gb ON rb.green_bean_id = gb.id
		LEFT JOIN roasting_plans rp ON rb.roasting_plan_id = rp.id
		WHERE rb.end_time IS NOT NULL AND rb.output_weight_kg IS NOT NULL
		AND rb.id NOT IN (SELECT roast_batch_id FROM cupping_records)
		ORDER BY rb.created_at DESC
	`).all();
	const recentCuppings = getCuppingRecords();
	return { batches, recentCuppings, user: locals.user };
};
