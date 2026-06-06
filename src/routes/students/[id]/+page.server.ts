import { redirect, error } from '@sveltejs/kit';
import { getStudentDetail } from '$lib/server/services/studentService';
import { getUserFromCookies, requireAuth } from '$lib/utils/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const user = getUserFromCookies(cookies);
	requireAuth(user);

	if (!user) {
		redirect(302, '/login');
	}

	const detail = await getStudentDetail(params.id);

	if (!detail) {
		error(404, '学生不存在');
	}

	return {
		user,
		student: detail.student,
		consumptionHistory: detail.consumptionHistory,
		makeupHistory: detail.makeupHistory
	};
};
