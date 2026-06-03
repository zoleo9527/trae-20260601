import { json, error } from '@sveltejs/kit';
import { confirmPayment } from '$lib/models';

export async function POST({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(400, '无效的ID');
	}

	const body = await request.json();
	const { amount, payment_type, confirmed_by, notes } = body;

	if (!amount || !payment_type || !confirmed_by) {
		throw error(400, '缺少必要字段');
	}

	try {
		const paymentId = confirmPayment({
			delivery_id: id,
			amount: parseFloat(amount),
			payment_type,
			confirmed_by: parseInt(confirmed_by),
			notes
		});

		return json({ success: true, payment_id: paymentId });
	} catch (e) {
		throw error(500, (e as Error).message);
	}
}
