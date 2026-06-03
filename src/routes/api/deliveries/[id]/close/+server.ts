import { json, error } from '@sveltejs/kit';
import { closeDelivery } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const { user_id, reason } = body;

	if (!user_id || !reason) {
		throw error(400, '缺少必要字段');
	}

	try {
		closeDelivery(id, parseInt(user_id), reason);
		return json({ success: true });
	} catch (e) {
		throw error(500, (e as Error).message);
	}
}
