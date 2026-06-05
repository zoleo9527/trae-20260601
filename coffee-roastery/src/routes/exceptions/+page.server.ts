import { getExceptions } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') || undefined;
	const entityType = url.searchParams.get('entity_type') || undefined;
	const exceptions = getExceptions({ status, entity_type: entityType });
	return { exceptions };
};
