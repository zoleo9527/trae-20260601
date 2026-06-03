import { json, error } from '@sveltejs/kit';
import { getDeliveryDetail, getTimelineEvents } from '$lib/models';

export function GET({ params }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const delivery = getDeliveryDetail(id);
	if (!delivery) {
		throw error(404, '租赁单不存在');
	}

	const timeline = getTimelineEvents(id);

	return json({
		delivery,
		timeline
	});
}
