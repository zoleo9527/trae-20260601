import { redirect, fail, error } from '@sveltejs/kit';
import {
	getConsumptionById,
	confirmConsumption,
	rejectConsumption
} from '$lib/server/services/consumptionService';
import type { PageServerLoad, Actions } from './$types';
import type { UserRole } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const userId = cookies.get('userId');
	const userName = cookies.get('userName');
	const userRole = cookies.get('userRole') as UserRole | undefined;

	if (!userId || !userName || !userRole) {
		redirect(302, '/login');
	}

	const consumption = await getConsumptionById(params.id);

	if (!consumption) {
		error(404, '课消记录不存在');
	}

	return {
		user: {
			id: userId,
			name: userName,
			role: userRole
		},
		consumption
	};
};

export const actions: Actions = {
	confirm: async ({ cookies, params }) => {
		const userId = cookies.get('userId');
		const userName = cookies.get('userName');
		const userRole = cookies.get('userRole');

		if (!userId || !userName || !userRole) {
			return fail(401, { error: '未登录' });
		}

		if (!['teacher', 'admin'].includes(userRole)) {
			return fail(403, { error: '权限不足' });
		}

		const consumption = await getConsumptionById(params.id);

		if (!consumption) {
			return fail(404, { error: '课消记录不存在' });
		}

		if (consumption.status !== 'pending') {
			return fail(400, { error: '只有待确认状态的记录可以确认' });
		}

		try {
			await confirmConsumption(params.id, userId, userName);
		} catch (err) {
			return fail(500, { error: '确认失败，请重试' });
		}

		redirect(302, `/consumption/${params.id}`);
	},

	reject: async ({ cookies, params, request }) => {
		const userId = cookies.get('userId');
		const userName = cookies.get('userName');
		const userRole = cookies.get('userRole');

		if (!userId || !userName || !userRole) {
			return fail(401, { error: '未登录' });
		}

		if (!['teacher', 'admin'].includes(userRole)) {
			return fail(403, { error: '权限不足' });
		}

		const consumption = await getConsumptionById(params.id);

		if (!consumption) {
			return fail(404, { error: '课消记录不存在' });
		}

		if (consumption.status !== 'pending') {
			return fail(400, { error: '只有待确认状态的记录可以驳回' });
		}

		const formData = await request.formData();
		const reason = formData.get('reason') as string;

		if (!reason || !reason.trim()) {
			return fail(400, { error: '请输入驳回原因' });
		}

		try {
			await rejectConsumption(params.id, userId, userName, reason.trim());
		} catch (err) {
			return fail(500, { error: '驳回失败，请重试' });
		}

		redirect(302, `/consumption/${params.id}`);
	}
};
