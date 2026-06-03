import { json, error } from '@sveltejs/kit';
import { createRepairFollowup } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const { assigned_to, repair_type, repair_description, created_by } = body;

	if (!assigned_to || !repair_type || !repair_description || !created_by) {
		throw error(400, '缺少必要字段');
	}

	try {
		const repairId = createRepairFollowup({
			damage_report_id: id,
			assigned_to: parseInt(assigned_to),
			repair_type,
			repair_description,
			created_by: parseInt(created_by)
		});

		return json({ success: true, repair_id: repairId });
	} catch (e) {
		throw error(500, (e as Error).message);
	}
}
