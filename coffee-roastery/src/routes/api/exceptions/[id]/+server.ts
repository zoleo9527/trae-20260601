import { updateException } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const data = await request.json();
	try {
		updateException(Number(params.id), {
			status: data.status,
			resolution: data.resolution,
			handler_id: locals.user.id
		});
		return json({ ok: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
