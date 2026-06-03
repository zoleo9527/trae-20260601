import { json, error } from '@sveltejs/kit';
import { updateRepairStatus } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const { status, user_id, notes, actual_cost } = body;

	if (!status || !user_id) {
		throw error(400, '缺少必要字段');
	}

	try {
		updateRepairStatus(
			id,
			status,
			parseInt(user_id),
			notes,
			actual_cost !== undefined ? parseFloat(actual_cost) : undefined
		);
		return json({ success: true });
	} catch (e) {
		throw error(500, (e as Error).message);
	}
}
