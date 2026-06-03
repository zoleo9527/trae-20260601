import { json, error } from '@sveltejs/kit';
import { createDamageReport } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const {
		reported_by,
		damage_type,
		description,
		severity,
		estimated_cost,
		materials_provided,
		materials_missing
	} = body;

	if (!reported_by || !damage_type || !description || !severity) {
		throw error(400, '缺少必要字段');
	}

	try {
		const reportId = createDamageReport({
			delivery_id: id,
			reported_by: parseInt(reported_by),
			damage_type,
			description,
			severity,
			estimated_cost: estimated_cost ? parseFloat(estimated_cost) : undefined,
			materials_provided,
			materials_missing
		});

		return json({ success: true, report_id: reportId });
	} catch (e) {
		const msg = (e as Error).message;
		if (msg.includes('无权') || msg.includes('不允许') || msg.includes('需为')) {
			throw error(403, msg);
		}
		throw error(500, msg);
	}
}
