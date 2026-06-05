<script lang="ts">
	let { data } = $props();
	let statusFilter = $state('');

	const statusMap: Record<string, string> = {
		planned: '待审批',
		approved: '已审批',
		in_progress: '进行中',
		completed: '已完成',
		cancelled: '已取消'
	};

	const statusColor: Record<string, string> = {
		planned: 'bg-yellow-100 text-yellow-800',
		approved: 'bg-blue-100 text-blue-800',
		in_progress: 'bg-indigo-100 text-indigo-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-stone-100 text-stone-500'
	};

	const priorityMap: Record<string, string> = {
		low: '低',
		normal: '普通',
		high: '高',
		urgent: '紧急'
	};

	const priorityColor: Record<string, string> = {
		low: 'text-stone-400',
		normal: 'text-stone-600',
		high: 'text-orange-600',
		urgent: 'text-red-600 font-bold'
	};

	const exceptionPlanIds = new Set((data.exceptions as any[]).map((e: any) => e.entity_id));
</script>

<div>
	<div class="mb-6">
		<h2 class="text-xl font-bold text-stone-800">烘焙计划</h2>
		<p class="text-sm text-stone-500 mt-0.5">共 {(data.plans as any[]).length} 个计划</p>
	</div>

	<div class="flex gap-3 mb-4">
		<select bind:value={statusFilter} onchange={() => {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			window.location.href = `/roasting-plans?${params.toString()}`;
		}} class="border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400">
			<option value="">全部状态</option>
			<option value="planned">待审批</option>
			<option value="approved">已审批</option>
			<option value="in_progress">进行中</option>
			<option value="completed">已完成</option>
			<option value="cancelled">已取消</option>
		</select>
	</div>

	<div class="space-y-3">
		{#each data.plans as plan (plan.id)}
			<a href="/roasting-plans/{plan.id}" class="block bg-white rounded-lg border border-stone-200 p-4 hover:shadow-sm transition-shadow">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="font-mono text-xs text-stone-400">{plan.plan_no}</span>
						<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {statusColor[plan.status]}">{statusMap[plan.status]}</span>
						<span class={priorityColor[plan.priority]}>{priorityMap[plan.priority]}</span>
						{#if exceptionPlanIds.has(plan.id)}
							<span class="text-xs text-red-600">⚠ 有异常</span>
						{/if}
					</div>
					<span class="text-sm text-stone-500">{plan.plan_date}</span>
				</div>
				<div class="mt-2 flex items-center gap-4">
					<span class="text-sm font-medium text-stone-800">{plan.green_bean_name || '未知豆'}</span>
					<span class="text-xs text-stone-400 font-mono">{plan.green_bean_batch_no}</span>
				</div>
				<div class="mt-1 text-sm text-stone-600">
					{plan.target_roast_level} · {plan.batch_size_kg}kg → {plan.expected_output_kg}kg
					{#if plan.roaster_name} · {plan.roaster_name}{/if}
				</div>
			</a>
		{/each}
		{#if data.plans.length === 0}
			<div class="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-400">暂无烘焙计划</div>
		{/if}
	</div>
</div>
