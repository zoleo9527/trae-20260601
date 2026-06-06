import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { UserRole } from '$lib/types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const userId = cookies.get('userId');
	const userName = cookies.get('userName');
	const userRole = cookies.get('userRole') as UserRole | undefined;

	const isLoginPage = url.pathname === '/login';

	if (!userId || !userName || !userRole) {
		if (!isLoginPage) {
			redirect(302, '/login');
		}
		return {
			user: null
		};
	}

	if (isLoginPage) {
		redirect(302, '/');
	}

	return {
		user: {
			id: userId,
			name: userName,
			role: userRole
		}
	};
};
