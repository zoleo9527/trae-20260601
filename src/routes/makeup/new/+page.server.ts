import { redirect, fail } from '@sveltejs/kit';
import { getUserFromCookies, requireAuth, isConsultant, isAdmin } from '$lib/utils/auth';
import { createMakeup } from '$lib/server/services/makeupService';
import { getStudents } from '$lib/server/services/studentService';
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
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const studentId = formData.get('studentId') as string;
		const originalCourseDate = formData.get('originalCourseDate') as string;
		const originalCourseName = formData.get('originalCourseName') as string;
		const reason = formData.get('reason') as string;

		if (!studentId || !originalCourseDate || !originalCourseName) {
			return fail(400, {
				error: '请填写所有必填项',
				studentId,
				originalCourseDate,
				originalCourseName,
				reason
			});
		}

		try {
			await createMakeup(
				{
					studentId,
					originalCourseDate,
					originalCourseName,
					reason
				},
				user.id,
				user.name
			);
		} catch (error) {
			return fail(500, {
				error: '创建补课申请失败',
				studentId,
				originalCourseDate,
				originalCourseName,
				reason
			});
		}

		redirect(302, '/makeup');
	}
};
