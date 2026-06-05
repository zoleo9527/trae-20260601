import { getGreenBean, getTimeline, getExceptions, getRoastingPlans } from '$lib/db.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const bean = getGreenBean(Number(params.id));
	if (!bean) throw error(404, '生豆批次不存在');
	const timeline = getTimeline('green_bean', bean.id);
	const exceptions = getExceptions({ entity_type: 'green_bean', entity_id: bean.id });
	const plans = getRoastingPlans({ green_bean_id: bean.id });
	return { bean, timeline, exceptions, plans };
};
