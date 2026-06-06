import { redirect, fail } from '@sveltejs/kit';
import { createConsumption } from '$lib/server/services/consumptionService';
import { getStudents } from '$lib/server/services/studentService';
import { getUserFromCookies, requireAuth } from '$lib/utils/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = getUserFromCookies(cookies);
	requireAuth(user, ['consultant', 'admin']);

	if (!user) {
		redirect(302, '/login');
	}

	const students = await getStudents();
	const preselectedStudentId = url.searchParams.get('studentId') || '';

	return {
		user,
		students,
		preselectedStudentId
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const user = getUserFromCookies(cookies);
		requireAuth(user, ['consultant', 'admin']);

		if (!user) {
			return fail(401, { error: '未登录' });
		}

		const formData = await request.formData();
		const studentId = formData.get('studentId') as string;
		const courseName = formData.get('courseName') as string;
		const hours = formData.get('hours') as string;
		const remark = formData.get('remark') as string;

		if (!studentId) {
			return fail(400, { error: '请选择学生', studentId, courseName, hours, remark });
		}

		if (!courseName || !courseName.trim()) {
			return fail(400, { error: '请输入课程名称', studentId, courseName, hours, remark });
		}

		if (!hours || isNaN(Number(hours)) || Number(hours) <= 0) {
			return fail(400, { error: '请输入有效的课时数', studentId, courseName, hours, remark });
		}

		try {
			await createConsumption(
				{
					studentId,
					courseName: courseName.trim(),
					hours: Number(hours),
					remark: remark?.trim() || undefined
				},
				user.id,
				user.name
			);
		} catch (error) {
			return fail(500, { error: '创建失败，请重试', studentId, courseName, hours, remark });
		}

		redirect(302, '/consumption');
	}
};
