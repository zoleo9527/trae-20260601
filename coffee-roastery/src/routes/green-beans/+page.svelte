<script lang="ts">
	let { data } = $props();
	let showForm = $state(false);
	let search = $state('');
	let statusFilter = $state('');
	let submitError = $state('');

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

	const beanCount = (data.beans as any[]).length;
	const exceptionBeanIds = new Set((data.exceptions as any[]).map((e: any) => e.entity_id));

	let form = $state({
		name: '', origin: '', variety: '', process: '水洗',
		weight_kg: '', bag_count: '', supplier: '', contract_no: '',
		arrival_date: new Date().toISOString().slice(0, 10),
		warehouse_location: '', moisture_content: '', density: '',
		screen_size: '', notes: ''
	});

	async function submitBean() {
		try {
			const wkg = parseFloat(form.weight_kg);
			const res = await fetch('/api/green-beans', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					weight_kg: wkg,
					remaining_kg: wkg,
					bag_count: parseInt(form.bag_count),
					moisture_content: form.moisture_content ? parseFloat(form.moisture_content) : null,
					density: form.density ? parseFloat(form.density) : null,
				})
			});
			if (res.ok) {
				showForm = false;
				submitError = '';
				window.location.reload();
			} else {
				const d = await res.json();
				submitError = d.error || '创建失败';
			}
		} catch {
			submitError = '网络错误';
		}
	}

	function reloadWithFilters() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (search) params.set('search', search);
		window.location.href = `/green-beans?${params.toString()}`;
	}
</script>

<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-xl font-bold text-stone-800">生豆入库</h2>
			<p class="text-sm text-stone-500 mt-0.5">共 {beanCount} 批次</p>
		</div>
		<button onclick={() => showForm = !showForm} class="bg-stone-800 text-white px-4 py-2 rounded text-sm hover:bg-stone-700 transition-colors">
			{showForm ? '取消' : '+ 新增入库'}
		</button>
	</div>

	{#if showForm}
		<div class="bg-white rounded-lg border border-stone-200 p-6 mb-6">
			<h3 class="text-base font-semibold text-stone-700 mb-4">新增生豆入库</h3>
			{#if submitError}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{submitError}</div>
			{/if}
			<form onsubmit={(e) => { e.preventDefault(); submitBean(); }}>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">豆名 *</label>
						<input type="text" bind:value={form.name} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">产地 *</label>
						<input type="text" bind:value={form.origin} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">品种 *</label>
						<input type="text" bind:value={form.variety} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">处理法</label>
						<select bind:value={form.process} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400">
							<option value="水洗">水洗</option>
							<option value="日晒">日晒</option>
							<option value="蜜处理">蜜处理</option>
							<option value="厌氧发酵">厌氧发酵</option>
							<option value="其他">其他</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">重量(kg) *</label>
						<input type="number" step="0.1" bind:value={form.weight_kg} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">袋数</label>
						<input type="number" bind:value={form.bag_count} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">供应商 *</label>
						<input type="text" bind:value={form.supplier} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">合同号</label>
						<input type="text" bind:value={form.contract_no} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">到货日期 *</label>
						<input type="date" bind:value={form.arrival_date} required class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">仓仓位</label>
						<input type="text" bind:value={form.warehouse_location} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">水分含量(%)</label>
						<input type="number" step="0.1" bind:value={form.moisture_content} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">密度(g/L)</label>
						<input type="number" step="1" bind:value={form.density} class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
					<div>
						<label class="block text-xs font-medium text-stone-600 mb-1">目数</label>
						<input type="text" bind:value={form.screen_size} placeholder="如 14+" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
					</div>
				</div>
				<div class="mt-4">
					<label class="block text-xs font-medium text-stone-600 mb-1">备注</label>
					<textarea bind:value={form.notes} rows="2" class="w-full border border-stone-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"></textarea>
				</div>
				<div class="mt-4 flex justify-end">
					<button type="submit" class="bg-stone-800 text-white px-6 py-2 rounded text-sm hover:bg-stone-700 transition-colors">确认入库</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="flex gap-3 mb-4">
		<input type="text" bind:value={search} placeholder="搜索豆名/批次号/产地..." class="border border-stone-300 rounded px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-stone-400" onkeydown={(e) => e.key === 'Enter' && reloadWithFilters()} />
		<select bind:value={statusFilter} onchange={reloadWithFilters} class="border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400">
			<option value="">全部状态</option>
			<option value="pending_inspection">待检验</option>
			<option value="inspected">已检验</option>
			<option value="stored">已入库</option>
			<option value="exception">异常</option>
		</select>
	</div>

	<div class="bg-white rounded-lg border border-stone-200 overflow-hidden">
		<table class="w-full text-sm">
			<thead class="bg-stone-50 border-b border-stone-200">
				<tr>
					<th class="text-left px-4 py-3 font-medium text-stone-600">批次号</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">豆名</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">产地</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">处理法</th>
					<th class="text-right px-4 py-3 font-medium text-stone-600">重量(kg)</th>
					<th class="text-right px-4 py-3 font-medium text-stone-600">剩余(kg)</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">状态</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">到货日期</th>
					<th class="text-left px-4 py-3 font-medium text-stone-600">操作</th>
				</tr>
			</thead>
			<tbody>
				{#each data.beans as bean (bean.id)}
					<tr class="border-b border-stone-100 hover:bg-stone-50">
						<td class="px-4 py-3 font-mono text-xs">{bean.batch_no}</td>
						<td class="px-4 py-3">
							<div class="font-medium text-stone-800">{bean.name}</div>
							{#if exceptionBeanIds.has(bean.id)}
								<span class="text-xs text-red-600">有未处理异常</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-stone-600">{bean.origin}</td>
						<td class="px-4 py-3 text-stone-600">{bean.process}</td>
						<td class="px-4 py-3 text-right">{bean.weight_kg}</td>
						<td class="px-4 py-3 text-right">{bean.remaining_kg}</td>
						<td class="px-4 py-3">
							<span class="inline-block px-2 py-0.5 rounded text-xs font-medium {statusColor[bean.status]}">{statusMap[bean.status]}</span>
						</td>
						<td class="px-4 py-3 text-stone-600">{bean.arrival_date}</td>
						<td class="px-4 py-3">
							<a href="/green-beans/{bean.id}" class="text-stone-600 hover:text-stone-900 underline text-xs">详情</a>
						</td>
					</tr>
				{/each}
				{#if data.beans.length === 0}
					<tr>
						<td colspan="9" class="px-4 py-8 text-center text-stone-400">暂无生豆入库记录</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
