<script lang="ts">
	let { data } = $props();
	let showForm = $state(false);
	let selectedBatch = $state('');
	let errorMessage = $state<string | null>(null);
	let cupForm = $state({
		aroma_score: '7',
		flavor_score: '7',
		aftertaste_score: '7',
		acidity_score: '7',
		body_score: '7',
		balance_score: '7',
		overall_score: '7',
		notes: ''
	});

	async function submitCupping() {
		if (!selectedBatch) {
			errorMessage = '请选择烘焙批次';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const scores = [
			parseFloat(cupForm.aroma_score),
			parseFloat(cupForm.flavor_score),
			parseFloat(cupForm.aftertaste_score),
			parseFloat(cupForm.acidity_score),
			parseFloat(cupForm.body_score),
			parseFloat(cupForm.balance_score),
			parseFloat(cupForm.overall_score)
		];
		if (scores.some(s => isNaN(s) || s < 0 || s > 10)) {
			errorMessage = '请输入有效的评分（0-10）';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		const res = await fetch('/api/cupping', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				roast_batch_id: parseInt(selectedBatch),
				aroma_score: parseFloat(cupForm.aroma_score),
				flavor_score: parseFloat(cupForm.flavor_score),
				aftertaste_score: parseFloat(cupForm.aftertaste_score),
				acidity_score: parseFloat(cupForm.acidity_score),
				body_score: parseFloat(cupForm.body_score),
				balance_score: parseFloat(cupForm.balance_score),
				overall_score: parseFloat(cupForm.overall_score),
				notes: cupForm.notes
			})
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ error: '提交失败' }));
			errorMessage = data.error || '提交失败';
			setTimeout(() => errorMessage = null, 3000);
			return;
		}
		showForm = false;
		selectedBatch = '';
		window.location.reload();
	}
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
		<h2 class="text-xl font-bold text-stone-800">杯测记录</h2>
		<p class="text-sm text-stone-500 mt-0.5">待杯测批次（已完结、未杯测）: {(data.batches as any[]).length}</p>
	</div>
		{#if data.user?.role === 'cupper'}
			<button onclick={() => showForm = !showForm} class="bg-stone-800 text-white px-4 py-2 rounded text-sm hover:bg-stone-700">
				{showForm ? '取消' : '+ 新增杯测'}
			</button>
		{/if}
	</div>

	{#if showForm}
		<div class="bg-white rounded-lg border border-stone-200 p-6 mb-6">
			<h3 class="text-base font-semibold text-stone-700 mb-4">新增杯测记录</h3>
			<div class="mb-4">
				<label class="block text-xs font-medium text-stone-600 mb-1">选择烘焙批次 *</label>
				<select bind:value={selectedBatch} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm">
					<option value="">请选择</option>
					{#each data.batches as batch (batch.id)}
						<option value={batch.id}>{batch.batch_no} - {batch.green_bean_name} ({batch.actual_roast_level})</option>
					{/each}
				</select>
			</div>
			<div class="grid grid-cols-4 gap-3 mb-4">
				<div><label class="block text-xs text-stone-600 mb-1">香气</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.aroma_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">风味</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.flavor_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">余韵</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.aftertaste_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">酸质</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.acidity_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">醇度</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.body_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">均衡</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.balance_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
				<div><label class="block text-xs text-stone-600 mb-1">综合 *</label><input type="number" step="0.25" min="0" max="10" bind:value={cupForm.overall_score} class="w-full border border-stone-300 rounded px-2 py-1 text-sm" /></div>
			</div>
			<div class="mb-4">
				<label class="block text-xs text-stone-600 mb-1">备注</label>
				<textarea bind:value={cupForm.notes} rows="2" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm"></textarea>
			</div>
			<button onclick={submitCupping} disabled={!selectedBatch} class="bg-stone-800 text-white px-6 py-2 rounded text-sm hover:bg-stone-700 disabled:opacity-50">提交杯测</button>
		</div>
	{/if}

	{#if (data.recentCuppings as any[]).length > 0}
		<div class="bg-white rounded-lg border border-stone-200 overflow-hidden">
			<table class="w-full text-sm">
				<thead class="bg-stone-50 border-b border-stone-200">
					<tr>
						<th class="text-left px-4 py-3 font-medium text-stone-600">批次</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">香</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">味</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">余</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">酸</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">体</th>
						<th class="text-center px-2 py-3 font-medium text-stone-600">均</th>
						<th class="text-center px-4 py-3 font-medium text-stone-600">综合</th>
						<th class="text-left px-4 py-3 font-medium text-stone-600">杯测员</th>
						<th class="text-left px-4 py-3 font-medium text-stone-600">时间</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentCuppings as cr (cr.id)}
						<tr class="border-b border-stone-100 hover:bg-stone-50">
							<td class="px-4 py-2 font-mono text-xs">{cr.batch_no}</td>
							<td class="px-2 py-2 text-center">{cr.aroma_score}</td>
							<td class="px-2 py-2 text-center">{cr.flavor_score}</td>
							<td class="px-2 py-2 text-center">{cr.aftertaste_score}</td>
							<td class="px-2 py-2 text-center">{cr.acidity_score}</td>
							<td class="px-2 py-2 text-center">{cr.body_score}</td>
							<td class="px-2 py-2 text-center">{cr.balance_score}</td>
							<td class="px-4 py-2 text-center font-bold {cr.overall_score >= 8 ? 'text-green-700' : cr.overall_score >= 6 ? 'text-stone-700' : 'text-orange-600'}">{cr.overall_score}</td>
							<td class="px-4 py-2">{cr.cupper_name}</td>
							<td class="px-4 py-2 text-stone-400 text-xs">{new Date(cr.created_at).toLocaleDateString('zh-CN')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-400">暂无杯测记录</div>
	{/if}
</div>
