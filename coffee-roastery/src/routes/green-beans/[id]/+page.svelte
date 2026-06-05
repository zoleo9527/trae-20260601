<script lang="ts">
	let { data } = $props();

	const statusMap: Record<string, string> = {
		pending_inspection: '待检验',
		inspected: '已检验',
		stored: '已入库',
		exception: '异常'
	};

	const statusColor: Record<string, string> = {
		pending_inspection: 'bg-yellow-100 text-yellow-800',
		inspected: 'bg-blue-100 text-blue-800',
		stored: 'bg-green-100 text-green-800',
		exception: 'bg-red-100 text-red-800'
	};

	let showExceptionDrawer = $state(false);
	let showCreatePlan = $state(false);
	let exForm = $state({ severity: 'medium', title: '', description: '' });
	let planForm = $state({
		plan_date: new Date().toISOString().slice(0, 10),
		target_roast_level: '浅烘焙',
		batch_size_kg: '',
		expected_output_kg: '',
		priority: 'normal',
		assigned_roaster: '',
		notes: ''
	});

	async function changeStatus(newStatus: string) {
		await fetch(`/api/green-beans/${data.bean.id}/status`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});
		window.location.reload();
	}

	async function submitException() {
		await fetch(`/api/exceptions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				entity_type: 'green_bean',
				entity_id: data.bean.id,
				...exForm
			})
		});
		showExceptionDrawer = false;
		exForm = { severity: 'medium', title: '', description: '' };
		window.location.reload();
	}

	async function submitPlan() {
		await fetch('/api/roasting-plans', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				green_bean_id: data.bean.id,
				...planForm,
				batch_size_kg: parseFloat(planForm.batch_size_kg),
				expected_output_kg: parseFloat(planForm.expected_output_kg),
				assigned_roaster: planForm.assigned_roaster ? parseInt(planForm.assigned_roaster) : null
			})
		});
		showCreatePlan = false;
		window.location.reload();
	}

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
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-bold text-stone-800">{data.bean.name}</h2>
				<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {statusColor[data.bean.status]}">{statusMap[data.bean.status]}</span>
			</div>
			<p class="text-sm text-stone-500 mt-0.5 font-mono">{data.bean.batch_no}</p>
		</div>
		<div class="flex gap-2">
			{#if data.bean.status === 'pending_inspection'}
				<button onclick={() => changeStatus('inspected')} class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors">确认检验通过</button>
			{/if}
			{#if data.bean.status === 'inspected'}
				<button onclick={() => changeStatus('stored')} class="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 transition-colors">确认入库</button>
			{/if}
			{#if data.bean.status === 'stored'}
				<button onclick={() => showCreatePlan = true} class="bg-stone-800 text-white px-3 py-1.5 rounded text-xs hover:bg-stone-700 transition-colors">创建烘焙计划</button>
			{/if}
			<button onclick={() => showExceptionDrawer = true} class="border border-red-300 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50 transition-colors">报告异常</button>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-6">
		<div>
			<div class="bg-white rounded-lg border border-stone-200 p-5 mb-6">
				<h3 class="text-sm font-semibold text-stone-700 mb-3">基本信息</h3>
				<dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
					<dt class="text-stone-500">产地</dt><dd class="text-stone-800">{data.bean.origin}</dd>
					<dt class="text-stone-500">品种</dt><dd class="text-stone-800">{data.bean.variety}</dd>
					<dt class="text-stone-500">处理法</dt><dd class="text-stone-800">{data.bean.process}</dd>
					<dt class="text-stone-500">供应商</dt><dd class="text-stone-800">{data.bean.supplier}</dd>
					<dt class="text-stone-500">合同号</dt><dd class="text-stone-800 font-mono">{data.bean.contract_no || '-'}</dd>
					<dt class="text-stone-500">到货日期</dt><dd class="text-stone-800">{data.bean.arrival_date}</dd>
					<dt class="text-stone-500">仓仓位</dt><dd class="text-stone-800">{data.bean.warehouse_location || '-'}</dd>
					<dt class="text-stone-500">重量/剩余</dt><dd class="text-stone-800">{data.bean.weight_kg}kg / {data.bean.remaining_kg}kg</dd>
					<dt class="text-stone-500">袋数</dt><dd class="text-stone-800">{data.bean.bag_count}</dd>
					<dt class="text-stone-500">水分含量</dt><dd class="text-stone-800">{data.bean.moisture_content != null ? data.bean.moisture_content + '%' : '-'}</dd>
					<dt class="text-stone-500">密度</dt><dd class="text-stone-800">{data.bean.density != null ? data.bean.density + ' g/L' : '-'}</dd>
					<dt class="text-stone-500">目数</dt><dd class="text-stone-800">{data.bean.screen_size || '-'}</dd>
				</dl>
				{#if data.bean.notes}
					<div class="mt-3 pt-3 border-t border-stone-100">
						<dt class="text-stone-500 text-sm">备注</dt>
						<dd class="text-stone-800 text-sm mt-1">{data.bean.notes}</dd>
					</div>
				{/if}
			</div>

			{#if data.plans.length > 0}
				<div class="bg-white rounded-lg border border-stone-200 p-5">
					<h3 class="text-sm font-semibold text-stone-700 mb-3">关联烘焙计划</h3>
					<div class="space-y-2">
						{#each data.plans as plan (plan.id)}
							<a href="/roasting-plans/{plan.id}" class="block p-3 rounded border border-stone-100 hover:bg-stone-50 transition-colors">
								<div class="flex justify-between items-center">
									<span class="font-mono text-xs text-stone-500">{plan.plan_no}</span>
									<span class="text-xs px-1.5 py-0.5 rounded {plan.status === 'completed' ? 'bg-green-100 text-green-800' : plan.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : plan.status === 'cancelled' ? 'bg-stone-100 text-stone-500' : 'bg-yellow-100 text-yellow-800'}">
										{plan.status === 'planned' ? '待审批' : plan.status === 'approved' ? '已审批' : plan.status === 'in_progress' ? '进行中' : plan.status === 'completed' ? '已完成' : '已取消'}
									</span>
								</div>
								<div class="text-sm text-stone-700 mt-1">{plan.target_roast_level} · {plan.batch_size_kg}kg · {plan.plan_date}</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div>
			<div class="bg-white rounded-lg border border-stone-200 p-5 mb-6">
				<h3 class="text-sm font-semibold text-stone-700 mb-3">处理时间线</h3>
				<div class="space-y-0">
					{#each data.timeline as evt, i (evt.id)}
						<div class="flex gap-3">
							<div class="flex flex-col items-center">
								<div class="w-2.5 h-2.5 rounded-full bg-stone-400 mt-1.5 shrink-0"></div>
								{#if i < data.timeline.length - 1}
									<div class="w-px flex-1 bg-stone-200 my-1"></div>
								{/if}
							</div>
							<div class="pb-4">
								<div class="text-sm text-stone-800">{evt.description}</div>
								<div class="text-xs text-stone-400 mt-0.5">
									{new Date(evt.created_at).toLocaleString('zh-CN')}
									{#if evt.creator_name} · {evt.creator_name}{/if}
								</div>
							</div>
						</div>
					{/each}
					{#if data.timeline.length === 0}
						<p class="text-sm text-stone-400">暂无处理记录</p>
					{/if}
				</div>
			</div>

			{#if data.exceptions.length > 0}
				<div class="bg-white rounded-lg border border-red-200 p-5">
					<h3 class="text-sm font-semibold text-red-700 mb-3">异常记录</h3>
					<div class="space-y-3">
						{#each data.exceptions as ex (ex.id)}
							<div class="border border-red-100 rounded p-3">
								<div class="flex justify-between items-start">
									<div>
										<span class="text-xs px-1.5 py-0.5 rounded {ex.severity === 'critical' ? 'bg-red-200 text-red-800' : ex.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}">{ex.severity === 'critical' ? '严重' : ex.severity === 'high' ? '高' : ex.severity === 'medium' ? '中' : '低'}</span>
										<span class="text-sm font-medium text-stone-800 ml-2">{ex.title}</span>
									</div>
									<span class="text-xs px-1.5 py-0.5 rounded {ex.status === 'resolved' ? 'bg-green-100 text-green-800' : ex.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}">
										{ex.status === 'open' ? '待处理' : ex.status === 'in_progress' ? '处理中' : '已解决'}
									</span>
								</div>
								<p class="text-sm text-stone-600 mt-1">{ex.description}</p>
								{#if ex.resolution}
									<p class="text-sm text-green-700 mt-1 bg-green-50 p-2 rounded">处理结果: {ex.resolution}</p>
								{/if}
								{#if ex.status !== 'resolved' && ex.status !== 'closed'}
									<button onclick={() => resolveException(ex.id)} class="mt-2 text-xs text-red-600 hover:text-red-800 underline">标记已解决</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showExceptionDrawer}
	<div class="fixed inset-0 bg-black/30 z-40" onclick={() => showExceptionDrawer = false}></div>
	<div class="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col">
		<div class="p-5 border-b border-stone-200 flex justify-between items-center">
			<h3 class="font-semibold text-stone-800">报告异常</h3>
			<button onclick={() => showExceptionDrawer = false} class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
		</div>
		<div class="flex-1 overflow-auto p-5">
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">严重程度</label>
				<select bind:value={exForm.severity} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm">
					<option value="low">低</option>
					<option value="medium">中</option>
					<option value="high">高</option>
					<option value="critical">严重</option>
				</select>
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">异常标题 *</label>
				<input type="text" bind:value={exForm.title} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">详细描述 *</label>
				<textarea bind:value={exForm.description} rows="4" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"></textarea>
			</div>
		</div>
		<div class="p-5 border-t border-stone-200">
			<button onclick={submitException} class="w-full bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition-colors" disabled={!exForm.title || !exForm.description}>提交异常</button>
		</div>
	</div>
{/if}

{#if showCreatePlan}
	<div class="fixed inset-0 bg-black/30 z-40" onclick={() => showCreatePlan = false}></div>
	<div class="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col">
		<div class="p-5 border-b border-stone-200 flex justify-between items-center">
			<h3 class="font-semibold text-stone-800">创建烘焙计划</h3>
			<button onclick={() => showCreatePlan = false} class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
		</div>
		<div class="flex-1 overflow-auto p-5">
			<p class="text-xs text-stone-500 mb-4">从生豆 {data.bean.batch_no} ({data.bean.name}) 直接创建烘焙计划</p>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">计划日期 *</label>
				<input type="date" bind:value={planForm.plan_date} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">目标烘焙度</label>
				<select bind:value={planForm.target_roast_level} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm">
					<option value="极浅烘焙">极浅烘焙</option>
					<option value="浅烘焙">浅烘焙</option>
					<option value="中浅烘焙">中浅烘焙</option>
					<option value="中烘焙">中烘焙</option>
					<option value="中深烘焙">中深烘焙</option>
					<option value="深烘焙">深烘焙</option>
				</select>
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">批次重量(kg) *</label>
				<input type="number" step="0.1" bind:value={planForm.batch_size_kg} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">预期产出(kg)</label>
				<input type="number" step="0.1" bind:value={planForm.expected_output_kg} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">优先级</label>
				<select bind:value={planForm.priority} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm">
					<option value="low">低</option>
					<option value="normal">普通</option>
					<option value="high">高</option>
					<option value="urgent">紧急</option>
				</select>
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">备注</label>
				<textarea bind:value={planForm.notes} rows="3" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"></textarea>
			</div>
		</div>
		<div class="p-5 border-t border-stone-200">
			<button onclick={submitPlan} class="w-full bg-stone-800 text-white py-2 rounded text-sm hover:bg-stone-700 transition-colors">创建计划</button>
		</div>
	</div>
{/if}
