import { json, error } from '@sveltejs/kit';
import { reviewDamageReport } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const { reviewer_id, approved, review_comment } = body;

	if (!reviewer_id || review_comment === undefined || review_comment === '') {
		throw error(400, '缺少必要字段');
	}

	try {
		reviewDamageReport(id, parseInt(reviewer_id), !!approved, review_comment);
		return json({ success: true });
	} catch (e) {
		throw error(500, (e as Error).message);
	}
}
