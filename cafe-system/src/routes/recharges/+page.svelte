<script lang="ts">
	let { data } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消'
	};
	const paymentLabels: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝'
	};

	const statusPills = [
		{ value: '', label: '全部' },
		{ value: 'pending', label: '待审核' },
		{ value: 'approved', label: '已通过' },
		{ value: 'rejected', label: '已退回' },
		{ value: 'cancelled', label: '已取消' }
	];

	let keyword = $state(data.currentKeyword || '');
	let dateFrom = $state(data.dateFrom || '');
	let dateTo = $state(data.dateTo || '');
	let showRejectModal = $state(false);
	let batchRejectNote = $state('');
	let selectedIds = $state<number[]>([]);

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}

	function statVal(v: number, unit?: string): string {
		if (v === 0) return '暂无';
		return unit ? `${v}${unit}` : String(v);
	}

	function buildUrl(overrides: Record<string, string> = {}) {
		const params = new URLSearchParams();
		const s = overrides.status !== undefined ? overrides.status : data.currentStatus;
		const k = overrides.keyword !== undefined ? overrides.keyword : keyword;
		const m = overrides.mine !== undefined ? overrides.mine : (data.currentMine ? '1' : '');
		const df = overrides.date_from !== undefined ? overrides.date_from : dateFrom;
		const dt = overrides.date_to !== undefined ? overrides.date_to : dateTo;
		if (s) params.set('status', s);
		if (k) params.set('keyword', k);
		if (m) params.set('mine', m);
		if (df) params.set('date_from', df);
		if (dt) params.set('date_to', dt);
		const qs = params.toString();
		return '/recharges' + (qs ? '?' + qs : '');
	}

	function exportUrl() {
		const params = new URLSearchParams();
		if (data.currentStatus) params.set('status', data.currentStatus);
		if (keyword) params.set('keyword', keyword);
		if (data.currentMine) params.set('mine', '1');
		if (dateFrom) params.set('date_from', dateFrom);
		if (dateTo) params.set('date_to', dateTo);
		const qs = params.toString();
		return '/recharges/export' + (qs ? '?' + qs : '');
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleSelectAll() {
		const pendingIds = data.recharges
			.filter((r: any) => r.status === 'pending')
			.map((r: any) => r.id);
		if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
			selectedIds = [];
		} else {
			selectedIds = [...pendingIds];
		}
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			window.location.href = buildUrl();
		}
	}

	function onSearchClick() {
		window.location.href = buildUrl();
	}

	function onClearSearch() {
		keyword = '';
		window.location.href = buildUrl({ keyword: '' });
	}

	function onDateChange() {
		window.location.href = buildUrl();
	}

	function onClearDates() {
		dateFrom = '';
		dateTo = '';
		window.location.href = buildUrl({ date_from: '', date_to: '' });
	}

	const pendingRecharges = $derived(data.recharges.filter((r: any) => r.status === 'pending'));
	const stats = $derived(data.stats);
</script>

<svelte:head>
	<title>充值记录 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>充值记录</h2>
		<p class="subtitle">共 {data.recharges.length} 条记录</p>
	</div>
	{#if data.user.role === 'operator'}
		<a href="/recharges/new" class="btn btn-primary">新建充值</a>
	{/if}
</div>

<div class="stat-grid">
	<div class="stat-card">
		<div class="stat-value">{stats.todaySubmitCount > 0 ? stats.todaySubmitCount : '暂无'}</div>
		<div class="stat-label">今日提交</div>
	</div>
	<div class="stat-card{data.user.role === 'admin' && stats.pendingCount > 0 ? ' stat-card-highlight' : ''}">
		<div class="stat-value">{stats.pendingCount > 0 ? stats.pendingCount : '暂无'}</div>
		<div class="stat-label">{data.user.role === 'admin' ? '⚠️ 待我审核' : '待审核'}</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{stats.todayApprovedCount > 0 ? `¥${stats.todayApprovedAmount.toFixed(0)}` : '暂无'}</div>
		<div class="stat-label">今日通过金额</div>
		{#if stats.todayApprovedCount > 0}
			<div class="stat-sub">{stats.todayApprovedCount} 笔</div>
		{/if}
	</div>
	<div class="stat-card">
		<div class="stat-value">{stats.monthApprovedCount > 0 ? `¥${stats.monthApprovedAmount.toFixed(0)}` : '暂无'}</div>
		<div class="stat-label">本月通过金额</div>
		{#if stats.monthApprovedCount > 0}
			<div class="stat-sub">{stats.monthApprovedCount} 笔</div>
		{/if}
	</div>
</div>

<div class="filter-bar">
	<div class="filter-pills">
		{#each statusPills as pill}
			<a href={buildUrl({ status: pill.value })} class="filter-pill" class:active={data.currentStatus === pill.value}>{pill.label}</a>
		{/each}
	</div>
	<div class="filter-search">
		<input type="text" placeholder="搜索会员名或手机号" bind:value={keyword} onkeydown={onSearchKeydown} />
		{#if keyword}
			<button type="button" class="search-clear" onclick={onClearSearch}>✕</button>
		{/if}
		<button type="button" class="btn btn-sm btn-primary" onclick={onSearchClick}>搜索</button>
	</div>
	<div class="filter-dates">
		<input type="date" bind:value={dateFrom} onchange={onDateChange} />
		<span class="date-sep">~</span>
		<input type="date" bind:value={dateTo} onchange={onDateChange} />
		{#if dateFrom || dateTo}
			<button type="button" class="btn btn-sm" onclick={onClearDates}>清除</button>
		{/if}
	</div>
	{#if data.user.role === 'operator'}
		<a href={buildUrl({ mine: data.currentMine ? '' : '1' })} class="filter-toggle" class:active={data.currentMine}>
			只看自己提交
		</a>
	{/if}
	<div class="filter-export">
		{#if data.recharges.length > 0}
			<a href={exportUrl()} class="btn btn-sm" download>📥 导出CSV</a>
		{:else}
			<span class="btn btn-sm btn-disabled" title="当前筛选下无可导出数据">📥 导出CSV</span>
		{/if}
	</div>
</div>

{#if data.user.role === 'admin' && pendingRecharges.length > 0}
	<div class="batch-review-bar">
		<form method="POST" action="/recharges?batch_approve">
			<div class="batch-header">
				<span class="batch-title">📋 批量复核</span>
				<span class="batch-count">已选 {selectedIds.length} / {pendingRecharges.length} 条待审核</span>
				<div class="batch-actions">
					<button type="button" class="btn btn-sm" onclick={toggleSelectAll}>
						{selectedIds.length === pendingRecharges.length ? '取消全选' : '全选待审核'}
					</button>
					{#if selectedIds.length > 0}
						<button type="submit" class="btn btn-sm btn-success">✓ 批量通过</button>
						<button type="button" class="btn btn-sm btn-danger" onclick={() => showRejectModal = true}>✕ 批量退回</button>
					{/if}
				</div>
			</div>
			{#if selectedIds.length > 0}
				{#each selectedIds as id}
					<input type="hidden" name="ids" value={id} />
				{/each}
			{/if}
		</form>
	</div>
{/if}

{#if showRejectModal}
	<div class="modal-overlay" onclick={() => showRejectModal = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3>批量退回 ({selectedIds.length} 条)</h3>
			<div class="form-group" style="margin-top:16px;">
				<label>退回原因 *</label>
				<textarea bind:value={batchRejectNote} placeholder="请填写退回原因，将应用于所有选中的单据"></textarea>
			</div>
			<div class="modal-footer">
				<button class="btn" onclick={() => showRejectModal = false}>取消</button>
				<form method="POST" action="/recharges?batch_reject" style="display:inline;">
					{#each selectedIds as id}
						<input type="hidden" name="ids" value={id} />
					{/each}
					<input type="hidden" name="batch_reject_note" value={batchRejectNote} />
					<button type="submit" class="btn btn-danger" disabled={!batchRejectNote.trim()}>确认退回</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<div class="card">
	<div class="card-body" style="padding:0;">
		{#if data.recharges.length === 0}
			<div class="empty-state">
				<div class="icon">💰</div>
				<p>暂无充值记录</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						{#if data.user.role === 'admin' && pendingRecharges.length > 0}
							<th style="width:36px;"></th>
						{/if}
						<th>ID</th>
						<th>会员</th>
						<th>金额</th>
						<th>赠送时长</th>
						<th>支付方式</th>
						<th>操作人</th>
						<th>审核人</th>
						<th>状态</th>
						<th>提交时间</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.recharges as _r}
					{@const r = _r as any}
						<tr>
							{#if data.user.role === 'admin' && pendingRecharges.length > 0}
								<td>
									{#if r.status === 'pending'}
										<input type="checkbox" checked={selectedIds.includes(r.id)} onchange={() => toggleSelect(r.id)} />
									{/if}
								</td>
							{/if}
							<td>{r.id}</td>
							<td><a href="/members/{r.member_id}" style="font-weight:500;">{r.member_name}</a></td>
							<td style="font-weight:500;">¥{r.amount.toFixed(2)}</td>
							<td>{r.bonus_minutes > 0 ? r.bonus_minutes + '分钟' : '-'}</td>
							<td>{paymentLabels[r.payment_method] || r.payment_method}</td>
							<td>{r.operator_name}</td>
							<td>{r.reviewer_name || '-'}</td>
							<td><span class="status-badge status-{r.status}">{statusLabels[r.status]}</span></td>
							<td style="font-size:12px;color:var(--c-text-2);">{formatTime(r.created_at)}</td>
							<td><a href="/recharges/{r.id}" class="btn btn-sm">详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
