<script lang="ts">
	let { data } = $props();

	const statusMap: Record<string, string> = {
		planned: '待审批', approved: '已审批', in_progress: '进行中',
		completed: '已完成', cancelled: '已取消'
	};

	const statusColor: Record<string, string> = {
		planned: 'bg-yellow-100 text-yellow-800', approved: 'bg-blue-100 text-blue-800',
		in_progress: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-stone-100 text-stone-500'
	};

	let showExceptionDrawer = $state(false);
	let showStartBatch = $state(false);
	let showCompleteBatch = $state(false);
	let completingBatch = $state<any>(null);
	let errorMessage = $state<string | null>(null);
	let exForm = $state({ severity: 'medium', title: '', description: '' });
	let batchForm = $state({
		actual_roast_level: data.plan.target_roast_level,
		start_time: new Date().toISOString().slice(0, 16),
		input_weight_kg: String(data.plan.batch_size_kg),
		notes: ''
	});
	let completeForm = $state({
		end_time: new Date().toISOString().slice(0, 16),
		output_weight_kg: '',
		notes: ''
	});

	async function changePlanStatus(newStatus: string) {
		const res = await fetch(`/api/roasting-plans/${data.plan.id}/status`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '操作失败' }));
			errorMessage = data.error || '操作失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		window.location.reload();
	}

	async function submitException() {
		if (!exForm.title || !exForm.description) {
			errorMessage = '请填写异常标题和描述';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const res = await fetch('/api/exceptions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ entity_type: 'roasting_plan', entity_id: data.plan.id, ...exForm })
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '提交失败' }));
			errorMessage = data.error || '提交失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		showExceptionDrawer = false;
		exForm = { severity: 'medium', title: '', description: '' };
		window.location.reload();
	}

	async function submitBatch() {
		if (!batchForm.actual_roast_level || !batchForm.start_time || !batchForm.input_weight_kg) {
			errorMessage = '请填写完整的批次信息';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const inputWeight = parseFloat(batchForm.input_weight_kg);
		if (isNaN(inputWeight) || inputWeight <= 0) {
			errorMessage = '请输入有效的投入重量';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const res = await fetch('/api/roast-batches', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				roasting_plan_id: data.plan.id,
				green_bean_id: data.plan.green_bean_id,
				actual_roast_level: batchForm.actual_roast_level,
				start_time: batchForm.start_time,
				input_weight_kg: inputWeight,
				notes: batchForm.notes
			})
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '创建批次失败' }));
			errorMessage = data.error || '创建批次失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		showStartBatch = false;
		if (data.plan.status !== 'in_progress') {
			await changePlanStatus('in_progress');
		}
		if (data.plan.status === 'in_progress') {
			window.location.reload();
		}
	}

	async function resolveException(exId: number) {
		const resolution = prompt('请输入处理结果：');
		if (!resolution) return;
		const res = await fetch(`/api/exceptions/${exId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'resolved', resolution })
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '处理失败' }));
			errorMessage = data.error || '处理失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		window.location.reload();
	}

	function openCompleteBatch(batch: any) {
		completingBatch = batch;
		completeForm = {
			end_time: new Date().toISOString().slice(0, 16),
			output_weight_kg: String((batch.input_weight_kg * 0.85).toFixed(1)),
			notes: ''
		};
		showCompleteBatch = true;
	}

	async function submitCompleteBatch() {
		if (!completingBatch) return;
		if (!completeForm.end_time || !completeForm.output_weight_kg) {
			errorMessage = '请填写结束时间和产出重量';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const outputWeight = parseFloat(completeForm.output_weight_kg);
		if (isNaN(outputWeight) || outputWeight <= 0) {
			errorMessage = '请输入有效的产出重量';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const res = await fetch(`/api/roast-batches/${completingBatch.id}/complete`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				end_time: completeForm.end_time,
				output_weight_kg: outputWeight,
				notes: completeForm.notes
			})
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '完结批次失败' }));
			errorMessage = data.error || '完结批次失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		showCompleteBatch = false;
		completingBatch = null;
		window.location.reload();
	}

	const canApprove = data.plan.status === 'planned' && data.user.role !== 'cs';
	const canStart = data.plan.status === 'approved' && data.user.role === 'roaster';
</script>

<div>
	{#if errorMessage}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm flex items-center justify-between">
			<span>{errorMessage}</span>
			<button onclick={() => errorMessage = null} class="text-red-500 hover:text-red-700 ml-2">×</button>
		</div>
	{/if}
	<div class="flex items-center justify-between mb-6">
		<div>
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-bold text-stone-800">烘焙计划 {data.plan.plan_no}</h2>
				<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {statusColor[data.plan.status]}">{statusMap[data.plan.status]}</span>
			</div>
			<p class="text-sm text-stone-500 mt-0.5">关联生豆: <a href="/green-beans/{data.plan.green_bean_id}" class="underline">{data.plan.green_bean_batch_no} {data.plan.green_bean_name}</a></p>
		</div>
		<div class="flex gap-2">
			{#if canApprove}
				<button onclick={() => changePlanStatus('approved')} class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">审批通过</button>
			{/if}
			{#if canStart}
				<button onclick={() => showStartBatch = true} class="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-700">开始烘焙</button>
			{/if}
			<button onclick={() => showExceptionDrawer = true} class="border border-red-300 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50">报告异常</button>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-6">
		<div>
			<div class="bg-white rounded-lg border border-stone-200 p-5 mb-6">
				<h3 class="text-sm font-semibold text-stone-700 mb-3">计划详情</h3>
				<dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
					<dt class="text-stone-500">计划日期</dt><dd class="text-stone-800">{data.plan.plan_date}</dd>
					<dt class="text-stone-500">目标烘焙度</dt><dd class="text-stone-800">{data.plan.target_roast_level}</dd>
					<dt class="text-stone-500">批次重量</dt><dd class="text-stone-800">{data.plan.batch_size_kg} kg</dd>
					<dt class="text-stone-500">预期产出</dt><dd class="text-stone-800">{data.plan.expected_output_kg} kg</dd>
					<dt class="text-stone-500">指派烘焙师</dt><dd class="text-stone-800">{data.plan.roaster_name || '未指派'}</dd>
					<dt class="text-stone-500">生豆剩余</dt><dd class="text-stone-800">{data.plan.green_bean_remaining} kg</dd>
				</dl>
				{#if data.plan.notes}
					<div class="mt-3 pt-3 border-t border-stone-100 text-sm">
						<span class="text-stone-500">备注: </span><span class="text-stone-800">{data.plan.notes}</span>
					</div>
				{/if}
			</div>

			{#if data.batches.length > 0}
				<div class="bg-white rounded-lg border border-stone-200 p-5 mb-6">
					<h3 class="text-sm font-semibold text-stone-700 mb-3">烘焙批次</h3>
					<div class="space-y-2">
						{#each data.batches as batch (batch.id)}
							<div class="border border-stone-100 rounded p-3">
								<div class="flex justify-between items-center">
									<span class="font-mono text-xs text-stone-400">{batch.batch_no}</span>
									<div class="flex items-center gap-2">
										<span class="text-xs text-stone-500">{batch.actual_roast_level}</span>
										{#if !batch.end_time && data.user.role === 'roaster'}
											<button onclick={() => openCompleteBatch(batch)} class="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700">完结</button>
										{/if}
										{#if batch.end_time}
											<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已完结</span>
										{/if}
									</div>
								</div>
								<div class="text-sm text-stone-700 mt-1">
									投入 {batch.input_weight_kg}kg
									{#if batch.output_weight_kg}
										→ 产出 {batch.output_weight_kg}kg
										<span class="text-stone-500 ml-1">（失水率 {((1 - batch.output_weight_kg / batch.input_weight_kg) * 100).toFixed(1)}%）</span>
									{/if}
								</div>
								<div class="text-xs text-stone-400 mt-0.5">
									开始: {new Date(batch.start_time).toLocaleString('zh-CN')}
									{batch.end_time ? ` · 结束: ${new Date(batch.end_time).toLocaleString('zh-CN')}` : ' · 进行中'}
								</div>
								{#if data.cuppingMap && data.cuppingMap[batch.id]}
									<div class="mt-2 space-y-1">
										{#each data.cuppingMap[batch.id] as cup (cup.id)}
											<div class="bg-amber-50 border border-amber-100 rounded p-2 text-xs">
												<span class="font-medium text-amber-800">杯测</span>
												<span class="text-amber-700 ml-1">综合 {cup.overall_score} 分</span>
												<span class="text-amber-600 ml-1">({cup.cupper_name})</span>
												<span class="text-stone-500 ml-2">香{cup.aroma_score} 味{cup.flavor_score} 酸{cup.acidity_score} 体{cup.body_score} 均{cup.balance_score}</span>
												{#if cup.notes}
													<div class="text-amber-700 mt-0.5">{cup.notes}</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
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
										<span class="text-xs px-1.5 py-0.5 rounded {ex.severity === 'critical' ? 'bg-red-200 text-red-800' : ex.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}">
											{ex.severity === 'critical' ? '严重' : ex.severity === 'high' ? '高' : ex.severity === 'medium' ? '中' : '低'}
										</span>
										<span class="text-sm font-medium text-stone-800 ml-2">{ex.title}</span>
									</div>
									<span class="text-xs px-1.5 py-0.5 rounded {ex.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
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
			<button onclick={submitException} class="w-full bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700" disabled={!exForm.title || !exForm.description}>提交异常</button>
		</div>
	</div>
{/if}

{#if showStartBatch}
	<div class="fixed inset-0 bg-black/30 z-40" onclick={() => showStartBatch = false}></div>
	<div class="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col">
		<div class="p-5 border-b border-stone-200 flex justify-between items-center">
			<h3 class="font-semibold text-stone-800">开始烘焙批次</h3>
			<button onclick={() => showStartBatch = false} class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
		</div>
		<div class="flex-1 overflow-auto p-5">
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">实际烘焙度</label>
				<select bind:value={batchForm.actual_roast_level} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm">
					<option value="极浅烘焙">极浅烘焙</option>
					<option value="浅烘焙">浅烘焙</option>
					<option value="中浅烘焙">中浅烘焙</option>
					<option value="中烘焙">中烘焙</option>
					<option value="中深烘焙">中深烘焙</option>
					<option value="深烘焙">深烘焙</option>
				</select>
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">开始时间</label>
				<input type="datetime-local" bind:value={batchForm.start_time} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">投入重量(kg) *</label>
				<input type="number" step="0.1" bind:value={batchForm.input_weight_kg} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">备注</label>
				<textarea bind:value={batchForm.notes} rows="3" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"></textarea>
			</div>
		</div>
		<div class="p-5 border-t border-stone-200">
			<button onclick={submitBatch} class="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">确认开始</button>
		</div>
	</div>
{/if}

{#if showCompleteBatch && completingBatch}
	<div class="fixed inset-0 bg-black/30 z-40" onclick={() => showCompleteBatch = false}></div>
	<div class="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col">
		<div class="p-5 border-b border-stone-200 flex justify-between items-center">
			<h3 class="font-semibold text-stone-800">完结烘焙批次</h3>
			<button onclick={() => showCompleteBatch = false} class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
		</div>
		<div class="flex-1 overflow-auto p-5">
			<p class="text-xs text-stone-500 mb-4">批次 {completingBatch.batch_no} · 投入 {completingBatch.input_weight_kg}kg</p>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">结束时间 *</label>
				<input type="datetime-local" bind:value={completeForm.end_time} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">产出重量(kg) *</label>
				<input type="number" step="0.1" bind:value={completeForm.output_weight_kg} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm" />
				{#if completeForm.output_weight_kg && completingBatch.input_weight_kg}
					<p class="text-xs text-stone-400 mt-1">
						预计失水率: {((1 - parseFloat(completeForm.output_weight_kg) / completingBatch.input_weight_kg) * 100).toFixed(1)}%
					</p>
				{/if}
			</div>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">备注</label>
				<textarea bind:value={completeForm.notes} rows="3" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"></textarea>
			</div>
		</div>
		<div class="p-5 border-t border-stone-200">
			<button onclick={submitCompleteBatch} class="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700" disabled={!completeForm.end_time || !completeForm.output_weight_kg}>确认完结</button>
		</div>
	</div>
{/if}
