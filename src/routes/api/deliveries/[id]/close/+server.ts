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
		const msg = (e as Error).message;
		if (msg.includes('无权') || msg.includes('不允许') || msg.includes('需为')) {
			throw error(403, msg);
		}
		throw error(500, msg);
	}
}
