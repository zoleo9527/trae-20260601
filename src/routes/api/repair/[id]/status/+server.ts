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
		const msg = (e as Error).message;
		if (msg.includes('无权') || msg.includes('不允许') || msg.includes('流转')) {
			throw error(403, msg);
		}
		throw error(500, msg);
	}
}
