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
	let showRejectModal = $state(false);
	let batchRejectNote = $state('');
	let selectedIds = $state<number[]>([]);

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}

	function buildUrl(overrides: Record<string, string> = {}) {
		const params = new URLSearchParams();
		const s = overrides.status !== undefined ? overrides.status : data.currentStatus;
		const k = overrides.keyword !== undefined ? overrides.keyword : keyword;
		const m = overrides.mine !== undefined ? overrides.mine : (data.currentMine ? '1' : '');
		if (s) params.set('status', s);
		if (k) params.set('keyword', k);
		if (m) params.set('mine', m);
		const qs = params.toString();
		return '/recharges' + (qs ? '?' + qs : '');
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

	const pendingRecharges = $derived(data.recharges.filter((r: any) => r.status === 'pending'));
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
	{#if data.user.role === 'operator'}
		<a href={buildUrl({ mine: data.currentMine ? '' : '1' })} class="filter-toggle" class:active={data.currentMine}>
			只看自己提交
		</a>
	{/if}
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
					{#each data.recharges as r}
						<tr>
							{#if data.user.role === 'admin' && pendingRecharges.length > 0}
								<td>
									{#if (r as any).status === 'pending'}
										<input type="checkbox" checked={selectedIds.includes((r as any).id)} onchange={() => toggleSelect((r as any).id)} />
									{/if}
								</td>
							{/if}
							<td>{(r as any).id}</td>
							<td><a href="/members/{(r as any).member_id}" style="font-weight:500;">{(r as any).member_name}</a></td>
							<td style="font-weight:500;">¥{(r as any).amount.toFixed(2)}</td>
							<td>{(r as any).bonus_minutes > 0 ? (r as any).bonus_minutes + '分钟' : '-'}</td>
							<td>{paymentLabels[(r as any).payment_method] || (r as any).payment_method}</td>
							<td>{(r as any).operator_name}</td>
							<td>{(r as any).reviewer_name || '-'}</td>
							<td><span class="status-badge status-{(r as any).status}">{statusLabels[(r as any).status]}</span></td>
							<td style="font-size:12px;color:var(--c-text-2);">{formatTime((r as any).created_at)}</td>
							<td><a href="/recharges/{(r as any).id}" class="btn btn-sm">详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
