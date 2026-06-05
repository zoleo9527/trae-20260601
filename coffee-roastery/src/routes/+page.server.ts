import { getDashboardStats } from '$lib/db.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const stats = getDashboardStats();
	return { stats };
};
