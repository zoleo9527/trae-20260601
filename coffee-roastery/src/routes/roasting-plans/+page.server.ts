import { getRoastingPlans, getExceptions } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') || undefined;
	const plans = getRoastingPlans({ status });
	const exceptions = getExceptions({ entity_type: 'roasting_plan', status: 'open' });
	return { plans, exceptions };
};
