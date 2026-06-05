import { getDb } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const db = getDb();
	const startDate = url.searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
	const endDate = url.searchParams.get('end') || new Date().toISOString().slice(0, 10);

	const completedPlans = db.prepare(`
		SELECT rp.*, gb.name as green_bean_name, gb.batch_no as green_bean_batch_no, u.display_name as roaster_name
		FROM roasting_plans rp
		LEFT JOIN green_beans gb ON rp.green_bean_id = gb.id
		LEFT JOIN users u ON rp.assigned_roaster = u.id
		WHERE rp.status = 'completed' AND rp.updated_at >= ? AND rp.updated_at <= ?
		ORDER BY rp.updated_at DESC
	`).all(startDate, endDate + 'T23:59:59');

	const planIds = (completedPlans as any[]).map((p: any) => p.id);
	let batches: any[] = [];
	let cuppingRecords: any[] = [];

	if (planIds.length > 0) {
		const placeholders = planIds.map(() => '?').join(',');
		batches = db.prepare(`
			SELECT rb.*, rp.plan_no as plan_no
			FROM roast_batches rb
			LEFT JOIN roasting_plans rp ON rb.roasting_plan_id = rp.id
			WHERE rb.roasting_plan_id IN (${placeholders})
			ORDER BY rb.created_at DESC
		`).all(...planIds);

		const batchIds = batches.map(b => b.id);
		if (batchIds.length > 0) {
			const bPlaceholders = batchIds.map(() => '?').join(',');
			cuppingRecords = db.prepare(`
				SELECT cr.*, u.display_name as cupper_name, rb.batch_no
				FROM cupping_records cr
				LEFT JOIN users u ON cr.cupper_id = u.id
				LEFT JOIN roast_batches rb ON cr.roast_batch_id = rb.id
				WHERE cr.roast_batch_id IN (${bPlaceholders})
				ORDER BY cr.created_at DESC
			`).all(...batchIds);
		}
	}

	return { completedPlans, batches, cuppingRecords, startDate, endDate };
};
