import { createException } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });
	const data = await request.json();
	try {
		const id = createException({
			entity_type: data.entity_type,
			entity_id: data.entity_id,
			severity: data.severity || 'medium',
			title: data.title,
			description: data.description,
			created_by: locals.user.id
		});
		return json({ ok: true, id });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
