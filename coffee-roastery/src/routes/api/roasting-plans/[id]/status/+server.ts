import { getRoastingPlan, getRoastBatches, updateRoastingPlanStatus } from '$lib/db.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

const validTransitions: Record<string, string[]> = {
	planned: ['approved', 'cancelled'],
	approved: ['in_progress', 'cancelled'],
	in_progress: [],
	completed: [],
	cancelled: []
};

const rolePermissions: Record<string, string[]> = {
	roaster: ['approved', 'in_progress', 'cancelled'],
	cupper: [],
	cs: ['cancelled'],
	admin: ['approved', 'in_progress', 'completed', 'cancelled']
};

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: '未登录' }, { status: 401 });

	const planId = Number(params.id);
	const plan = getRoastingPlan(planId);
	if (!plan) return json({ error: '烘焙计划不存在' }, { status: 404 });

	const { status } = await request.json();
	const validStatuses = ['planned', 'approved', 'in_progress', 'completed', 'cancelled'];
	if (!validStatuses.includes(status)) {
		return json({ error: '无效状态' }, { status: 400 });
	}

	const userRole = locals.user.role;
	const allowedStatuses = rolePermissions[userRole] || [];
	if (!allowedStatuses.includes(status) && userRole !== 'admin') {
		return json({ error: `当前角色(${userRole})无权限变更为该状态` }, { status: 403 });
	}

	const currentStatus = (plan as any).status;
	const allowedTransitions = validTransitions[currentStatus] || [];
	if (!allowedTransitions.includes(status)) {
		return json({ error: `无法从「${currentStatus}」状态变更为「${status}」` }, { status: 400 });
	}

	if (status === 'completed') {
		const batches = getRoastBatches(planId) as any[];
		if (batches.length === 0) {
			return json({ error: '暂无烘焙批次，无法直接标记完成' }, { status: 400 });
		}
		const incompleteBatches = batches.filter(
			b => !b.end_time || b.output_weight_kg === null || b.output_weight_kg === undefined
		);
		if (incompleteBatches.length > 0) {
			return json(
				{ error: `存在 ${incompleteBatches.length} 个未完结批次，请先完成批次完结操作` },
				{ status: 400 }
			);
		}
	}

	updateRoastingPlanStatus(planId, status, locals.user.id);
	return json({ ok: true });
};
