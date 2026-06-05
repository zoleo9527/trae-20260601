import { getGreenBeans, getExceptions } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') || undefined;
	const search = url.searchParams.get('search') || undefined;
	const beans = getGreenBeans({ status, search });
	const exceptions = getExceptions({ entity_type: 'green_bean', status: 'open' });
	return { beans, exceptions };
};
