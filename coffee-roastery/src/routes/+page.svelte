<script lang="ts">
	let { data } = $props();
	const stats = data.stats;

	const statusMap: Record<string, string> = {
		pending_inspection: '待检验', inspected: '已检验', stored: '已入库', exception: '异常'
	};
	const statusColor: Record<string, string> = {
		pending_inspection: 'bg-yellow-100 text-yellow-800', inspected: 'bg-blue-100 text-blue-800',
		stored: 'bg-green-100 text-green-800', exception: 'bg-red-100 text-red-800'
	};
	const planStatusMap: Record<string, string> = {
		planned: '待审批', approved: '已审批', in_progress: '进行中', completed: '已完成', cancelled: '已取消'
	};
	const planStatusColor: Record<string, string> = {
		planned: 'bg-yellow-100 text-yellow-800', approved: 'bg-blue-100 text-blue-800',
		in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-stone-100 text-stone-500'
	};
</script>

<div>
	<div class="mb-6">
		<h2 class="text-xl font-bold text-stone-800">概览</h2>
		<p class="text-sm text-stone-500 mt-0.5">生豆入库与烘焙计划总览</p>
	</div>

	<div class="grid grid-cols-5 gap-4 mb-8">
		<div class="bg-white rounded-lg border border-stone-200 p-4">
			<div class="text-xs text-stone-500 mb-1">待检验生豆</div>
			<div class="text-2xl font-bold text-yellow-700">{stats.pendingBeans}</div>
		</div>
		<div class="bg-white rounded-lg border border-stone-200 p-4">
			<div class="text-xs text-stone-500 mb-1">已入库生豆</div>
			<div class="text-2xl font-bold text-green-700">{stats.storedBeans}</div>
		</div>
		<div class="bg-white rounded-lg border border-stone-200 p-4">
			<div class="text-xs text-stone-500 mb-1">待执行烘焙计划</div>
			<div class="text-2xl font-bold text-blue-700">{stats.plannedRoasts}</div>
		</div>
		<div class="bg-white rounded-lg border border-stone-200 p-4">
			<div class="text-xs text-stone-500 mb-1">进行中烘焙</div>
			<div class="text-2xl font-bold text-indigo-700">{stats.inProgressRoasts}</div>
		</div>
		<div class="bg-white rounded-lg border border-stone-200 p-4">
			<div class="text-xs text-stone-500 mb-1">未处理异常</div>
			<div class="text-2xl font-bold text-red-700">{stats.openExceptions}</div>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-6">
		<div class="bg-white rounded-lg border border-stone-200 p-5">
			<h3 class="text-sm font-semibold text-stone-700 mb-3">最近生豆入库</h3>
			{#if stats.recentBeans.length > 0}
				<div class="space-y-2">
					{#each stats.recentBeans as bean (bean.id)}
						<a href="/green-beans/{bean.id}" class="flex items-center justify-between p-2 rounded hover:bg-stone-50 transition-colors">
							<div>
								<div class="text-sm font-medium text-stone-800">{bean.name}</div>
								<div class="text-xs text-stone-400 font-mono">{bean.batch_no} · {bean.origin}</div>
							</div>
							<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {statusColor[bean.status]}">{statusMap[bean.status]}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-stone-400">暂无记录</p>
			{/if}
		</div>

		<div class="bg-white rounded-lg border border-stone-200 p-5">
			<h3 class="text-sm font-semibold text-stone-700 mb-3">最近烘焙计划</h3>
			{#if stats.recentPlans.length > 0}
				<div class="space-y-2">
					{#each stats.recentPlans as plan (plan.id)}
						<a href="/roasting-plans/{plan.id}" class="flex items-center justify-between p-2 rounded hover:bg-stone-50 transition-colors">
							<div>
								<div class="text-sm font-medium text-stone-800">{plan.green_bean_name || '未知'}</div>
								<div class="text-xs text-stone-400 font-mono">{plan.plan_no} · {plan.target_roast_level}</div>
							</div>
							<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {planStatusColor[plan.status]}">{planStatusMap[plan.status]}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-stone-400">暂无记录</p>
			{/if}
		</div>
	</div>
</div>
