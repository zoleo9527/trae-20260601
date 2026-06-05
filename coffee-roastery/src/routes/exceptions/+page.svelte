<script lang="ts">
	let { data } = $props();

	const severityMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
	const severityColor: Record<string, string> = {
		low: 'bg-stone-100 text-stone-600', medium: 'bg-yellow-100 text-yellow-800',
		high: 'bg-orange-100 text-orange-800', critical: 'bg-red-200 text-red-800'
	};
	const statusMap: Record<string, string> = { open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };
	const statusColor: Record<string, string> = {
		open: 'bg-red-100 text-red-800', in_progress: 'bg-blue-100 text-blue-800',
		resolved: 'bg-green-100 text-green-800', closed: 'bg-stone-100 text-stone-500'
	};
	const entityMap: Record<string, string> = { green_bean: '生豆', roasting_plan: '烘焙计划', roast_batch: '烘焙批次' };

	let statusFilter = $state('');
	let typeFilter = $state('');

	async function resolveException(exId: number) {
		const resolution = prompt('请输入处理结果：');
		if (!resolution) return;
		await fetch(`/api/exceptions/${exId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'resolved', resolution })
		});
		window.location.reload();
	}

	function getEntityLink(ex: any) {
		if (ex.entity_type === 'green_bean') return `/green-beans/${ex.entity_id}`;
		if (ex.entity_type === 'roasting_plan') return `/roasting-plans/${ex.entity_id}`;
		return '#';
	}
</script>

<div>
	<div class="mb-6">
		<h2 class="text-xl font-bold text-stone-800">异常处理</h2>
		<p class="text-sm text-stone-500 mt-0.5">共 {(data.exceptions as any[]).length} 条异常</p>
	</div>

	<div class="flex gap-3 mb-4">
		<select bind:value={typeFilter} onchange={() => {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (typeFilter) params.set('entity_type', typeFilter);
			window.location.href = `/exceptions?${params.toString()}`;
		}} class="border border-stone-300 rounded px-3 py-1.5 text-sm">
			<option value="">全部类型</option>
			<option value="green_bean">生豆</option>
			<option value="roasting_plan">烘焙计划</option>
			<option value="roast_batch">烘焙批次</option>
		</select>
		<select bind:value={statusFilter} onchange={() => {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (typeFilter) params.set('entity_type', typeFilter);
			window.location.href = `/exceptions?${params.toString()}`;
		}} class="border border-stone-300 rounded px-3 py-1.5 text-sm">
			<option value="">全部状态</option>
			<option value="open">待处理</option>
			<option value="in_progress">处理中</option>
			<option value="resolved">已解决</option>
		</select>
	</div>

	<div class="space-y-3">
		{#each data.exceptions as ex (ex.id)}
			<div class="bg-white rounded-lg border border-stone-200 p-4">
				<div class="flex items-center justify-between mb-2">
					<div class="flex items-center gap-2">
						<span class="text-xs px-1.5 py-0.5 rounded {severityColor[ex.severity]}">{severityMap[ex.severity]}</span>
						<span class="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{entityMap[ex.entity_type]}</span>
						<span class="text-sm font-medium text-stone-800">{ex.title}</span>
					</div>
					<span class="text-xs px-1.5 py-0.5 rounded {statusColor[ex.status]}">{statusMap[ex.status]}</span>
				</div>
				<p class="text-sm text-stone-600">{ex.description}</p>
				{#if ex.resolution}
					<p class="text-sm text-green-700 mt-1 bg-green-50 p-2 rounded">处理结果: {ex.resolution}</p>
				{/if}
				<div class="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
					<div class="text-xs text-stone-400">
						{new Date(ex.created_at).toLocaleString('zh-CN')}
						{#if ex.creator_name} · 提交: {ex.creator_name}{/if}
						{#if ex.handler_name} · 处理: {ex.handler_name}{/if}
					</div>
					<div class="flex gap-2">
						<a href={getEntityLink(ex)} class="text-xs text-stone-500 hover:text-stone-700 underline">查看实体</a>
						{#if ex.status !== 'resolved' && ex.status !== 'closed'}
							<button onclick={() => resolveException(ex.id)} class="text-xs text-red-600 hover:text-red-800 underline">标记已解决</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
		{#if (data.exceptions as any[]).length === 0}
			<div class="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-400">暂无异常记录</div>
		{/if}
	</div>
</div>
