import { redirect, fail } from '@sveltejs/kit';
import { getConsumptions } from '$lib/server/services/consumptionService';
import { getUserFromCookies, requireAuth } from '$lib/utils/auth';
import type { PageServerLoad, Actions } from './$types';
import type { ConsumptionStatus } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = getUserFromCookies(cookies);
	requireAuth(user);

	if (!user) {
		redirect(302, '/login');
	}

	const statusFilter = url.searchParams.get('status') as ConsumptionStatus | undefined;
	const searchKeyword = url.searchParams.get('search') as string | undefined;

	const consumptions = await getConsumptions({
		status: statusFilter || undefined
	});

	const filteredConsumptions = searchKeyword
		? consumptions.filter((c) =>
				c.studentName?.toLowerCase().includes(searchKeyword.toLowerCase())
			)
		: consumptions;

	return {
		user,
		consumptions: filteredConsumptions,
		filters: {
			status: statusFilter,
			search: searchKeyword
		}
	};
};

export const actions: Actions = {
	delete: async ({ request, cookies }) => {
		const userId = cookies.get('userId');
		const userName = cookies.get('userName');
		const userRole = cookies.get('userRole');

		if (!userId || !userName || !userRole) {
			return fail(401, { error: '未登录' });
		}

		if (!['consultant', 'admin'].includes(userRole)) {
			return fail(403, { error: '权限不足' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: '缺少记录ID' });
		}

		return { success: true };
	}
};
