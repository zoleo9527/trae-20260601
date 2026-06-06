import type { PageServerLoad } from './$types';
import { getDashboardData } from '$lib/server/services/dashboardService';
import { getUserFromCookies } from '$lib/utils/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = getUserFromCookies(cookies);
	const userId = user?.id || '';
	const userRole = user?.role || 'consultant';

	const dashboardData = await getDashboardData(userRole, userId);

	return {
		user,
		dashboardData
	};
};
