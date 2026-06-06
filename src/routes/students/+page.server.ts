import { redirect } from '@sveltejs/kit';
import { getStudents } from '$lib/server/services/studentService';
import { getUserFromCookies, requireAuth } from '$lib/utils/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = getUserFromCookies(cookies);
	requireAuth(user);

	if (!user) {
		redirect(302, '/login');
	}

	const students = await getStudents();

	return {
		user,
		students
	};
};
