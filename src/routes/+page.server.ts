import type { PageServerLoad } from './$types';
import { getDashboardData } from '$lib/server/services/dashboardService';

export const load: PageServerLoad = async ({ cookies }) => {
	const userId = cookies.get('userId') || '';
	const userRole = cookies.get('userRole') || 'consultant';

	const dashboardData = await getDashboardData(userRole, userId);

	return {
		dashboardData
	};
};
