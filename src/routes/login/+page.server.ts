import { redirect, fail } from '@sveltejs/kit';
import { login } from '$lib/server/services/authService';
import { setUserSession } from '$lib/utils/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const role = formData.get('role') as string;
		const name = formData.get('name') as string;

		if (!role || !name) {
			return fail(400, { error: '请选择角色并输入姓名' });
		}

		if (!['consultant', 'teacher', 'admin'].includes(role)) {
			return fail(400, { error: '无效的角色' });
		}

		try {
			const user = await login(role, name.trim());
			setUserSession(cookies, user);
		} catch (error) {
			return fail(500, { error: '登录失败，请重试' });
		}

		redirect(302, '/');
	}
};
