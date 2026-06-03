import { json } from '@sveltejs/kit';
import { getDeliveries } from '$lib/models';
import type { DeliveryStatus } from '$lib/types';

export function GET({ url }) {
	const status = url.searchParams.get('status') as DeliveryStatus | null;
	const deliveries = getDeliveries(status || undefined);
	return json(deliveries);
}
