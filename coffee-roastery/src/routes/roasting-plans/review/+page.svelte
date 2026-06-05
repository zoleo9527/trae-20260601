<script lang="ts">
	let { data } = $props();
	let startDate = $state(data.startDate);
	let endDate = $state(data.endDate);

	function reloadWithDates() {
		window.location.href = `/roasting-plans/review?start=${startDate}&end=${endDate}`;
	}

	function getBatchForPlan(planId: number) {
		return (data.batches as any[]).filter((b: any) => b.roasting_plan_id === planId);
	}

	function getCuppingForBatch(batchId: number) {
		return (data.cuppingMap as any)[batchId] || [];
	}

	function getExceptionsForPlan(planId: number) {
		return (data.exceptionMap as any)[planId] || [];
	}
</script>

<div>
	<div class="mb-6">
		<h2 class="text-xl font-bold text-stone-800">烘焙计划回看</h2>
		<p class="text-sm text-stone-500 mt-0.5">查看已完成烘焙计划的全流程追溯</p>
	</div>

	<div class="flex gap-3 mb-6">
		<div>
			<label class="block text-xs font-medium text-stone-600 mb-1">开始日期</label>
			<input type="date" bind:value={startDate} class="border border-stone-300 rounded px-2 py-1.5 text-sm" />
		</div>
		<div>
			<label class="block text-xs font-medium text-stone-600 mb-1">结束日期</label>
			<input type="date" bind:value={endDate} class="border border-stone-300 rounded px-2 py-1.5 text-sm" />
		</div>
		<div class="flex items-end">
			<button onclick={reloadWithDates} class="bg-stone-800 text-white px-4 py-1.5 rounded text-sm hover:bg-stone-700">查询</button>
		</div>
	</div>

	{#if (data.completedPlans as any[]).length === 0}
		<div class="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-400">
			所选时间范围内无已完成的烘焙计划
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.completedPlans as plan (plan.id)}
				{@const planAny = plan as any}
				{@const batches = getBatchForPlan(planAny.id)}
				{@const planExceptions = getExceptionsForPlan(planAny.id)}
				<div class="bg-white rounded-lg border border-stone-200 overflow-hidden">
					<div class="p-4 bg-stone-50 border-b border-stone-200">
						<div class="flex items-center justify-between">
							<div>
								<span class="font-mono text-xs text-stone-400">{planAny.plan_no}</span>
								<span class="text-sm font-medium text-stone-800 ml-2">{planAny.green_bean_name}</span>
								<span class="text-xs text-stone-400 ml-2">{planAny.target_roast_level} · {planAny.batch_size_kg}kg</span>
								{#if planExceptions.length > 0}
									<span class="text-xs text-red-600 ml-2">⚠ 有异常</span>
								{/if}
							</div>
							<div class="text-xs text-stone-500">
								{planAny.roaster_name || '未指派'} · 完成: {new Date(planAny.updated_at).toLocaleDateString('zh-CN')}
							</div>
						</div>
					</div>
					{#if planExceptions.length > 0}
						<div class="p-3 bg-red-50 border-b border-red-100">
							<div class="text-xs font-medium text-red-700 mb-2">异常记录:</div>
							{#each planExceptions as ex (ex.id)}
								{@const exAny = ex as any}
								<div class="text-xs text-red-600 mb-1">
									• [{exAny.severity === 'critical' ? '严重' : exAny.severity === 'high' ? '高' : exAny.severity === 'medium' ? '中' : '低'}] {exAny.title}
									{#if exAny.resolution}
										<span class="text-green-700 ml-2">→ 已解决: {exAny.resolution}</span>
									{:else}
										<span class="text-red-500 ml-2">→ {exAny.status === 'open' ? '待处理' : exAny.status}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
					{#if batches.length > 0}
						<div class="p-4">
							{#each batches as batch (batch.id)}
								{@const batchAny = batch as any}
								{@const cuppings = getCuppingForBatch(batchAny.id)}
								<div class="border border-stone-100 rounded p-3 mb-2">
									<div class="flex justify-between items-center text-sm">
										<span class="font-mono text-xs text-stone-400">{batchAny.batch_no}</span>
										<span class="text-xs text-stone-600">{batchAny.actual_roast_level}</span>
									</div>
									<div class="text-sm text-stone-700 mt-1">
										投入 {batchAny.input_weight_kg}kg{batchAny.output_weight_kg ? ` → 产出 ${batchAny.output_weight_kg}kg` : ''}
										{#if batchAny.output_weight_kg && batchAny.input_weight_kg}
											<span class="text-stone-400 ml-2">失水率 {((1 - batchAny.output_weight_kg / batchAny.input_weight_kg) * 100).toFixed(1)}%</span>
										{/if}
									</div>
									{#if cuppings.length > 0}
										<div class="mt-2 space-y-1">
											{#each cuppings as cupping (cupping.id)}
												{@const cAny = cupping as any}
												<div class="bg-amber-50 border border-amber-100 rounded p-2 text-xs">
													<span class="font-medium text-amber-800">杯测</span>
													<span class="text-amber-700 ml-1">综合 {cAny.overall_score} 分</span>
													<span class="text-amber-600 ml-1">({cAny.cupper_name})</span>
													<span class="text-stone-500 ml-2">香{cAny.aroma_score} 味{cAny.flavor_score} 酸{cAny.acidity_score} 体{cAny.body_score} 均{cAny.balance_score}</span>
													{#if cAny.notes}
														<div class="text-amber-700 mt-0.5">备注: {cAny.notes}</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-4 text-sm text-stone-400">暂无烘焙批次记录</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
