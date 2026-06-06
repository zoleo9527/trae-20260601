import { redirect } from '@sveltejs/kit';
import { getUserFromCookies, requireAuth } from '$lib/utils/auth';
import { getMakeups } from '$lib/server/services/makeupService';
import type { PageServerLoad } from './$types';
import type { MakeupStatus } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = getUserFromCookies(cookies);
	requireAuth(user);

	if (!user) {
		redirect(302, '/login');
	}

	const status = url.searchParams.get('status') as MakeupStatus | null;
	const makeups = await getMakeups(status ? { status } : undefined);

	return {
		user,
		makeups,
		selectedStatus: status
	};
};
