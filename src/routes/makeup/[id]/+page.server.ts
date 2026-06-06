import { redirect, fail, error } from '@sveltejs/kit';
import { getUserFromCookies, requireAuth, AuthError } from '$lib/utils/auth';
import {
	getMakeupById,
	scheduleMakeup,
	completeMakeup,
	cancelMakeup,
	PermissionError,
	StateError
} from '$lib/server/services/makeupService';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const user = getUserFromCookies(cookies);

	if (!user) {
		redirect(302, '/login');
	}

	const makeup = await getMakeupById(params.id);

	if (!makeup) {
		error(404, '补课记录不存在');
	}

	return {
		user,
		makeup
	};
};

export const actions: Actions = {
	schedule: async ({ request, cookies, params }) => {
		const user = getUserFromCookies(cookies);

		if (!user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const scheduledDate = formData.get('scheduledDate') as string;
		const classroom = formData.get('classroom') as string;

		if (!scheduledDate || !classroom) {
			return fail(400, {
				scheduleError: '请填写所有必填项',
				scheduledDate,
				classroom
			});
		}

		try {
			requireAuth(user, ['teacher', 'admin']);
			await scheduleMakeup(params.id, user, scheduledDate, classroom);
		} catch (e) {
			if (e instanceof AuthError || e instanceof PermissionError || e instanceof StateError) {
				return fail(403, {
					scheduleError: e.message,
					scheduledDate,
					classroom
				});
			}
			return fail(500, {
				scheduleError: '安排补课失败',
				scheduledDate,
				classroom
			});
		}

		return { success: true };
	},

	complete: async ({ request, cookies, params }) => {
		const user = getUserFromCookies(cookies);

		if (!user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const content = formData.get('makeupContent') as string;

		if (!content) {
			return fail(400, {
				completeError: '请输入补课内容',
				makeupContent: content
			});
		}

		try {
			requireAuth(user, ['teacher', 'admin']);
			await completeMakeup(params.id, user, content);
		} catch (e) {
			if (e instanceof AuthError || e instanceof PermissionError || e instanceof StateError) {
				return fail(403, {
					completeError: e.message,
					makeupContent: content
				});
			}
			return fail(500, {
				completeError: '完成补课失败',
				makeupContent: content
			});
		}

		return { success: true };
	},

	cancel: async ({ request, cookies, params }) => {
		const user = getUserFromCookies(cookies);

		if (!user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const reason = formData.get('cancelReason') as string;

		if (!reason) {
			return fail(400, {
				cancelError: '请输入取消原因',
				cancelReason: reason
			});
		}

		try {
			requireAuth(user);
			await cancelMakeup(params.id, user, reason);
		} catch (e) {
			if (e instanceof AuthError || e instanceof PermissionError || e instanceof StateError) {
				return fail(403, {
					cancelError: e.message,
					cancelReason: reason
				});
			}
			return fail(500, {
				cancelError: '取消补课失败',
				cancelReason: reason
			});
		}

		return { success: true };
	}
};
