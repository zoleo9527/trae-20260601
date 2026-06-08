<script lang="ts">
	let { data } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '复核不通过', cancelled: '已取消'
	};
	const sourceLabels: Record<string, string> = {
		manual: '手动', tournament: '赛事', promotion: '活动', recharge_bonus: '充值赠送'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>时长赠送记录 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>时长赠送记录</h2>
		<p class="subtitle">共 {data.timeGifts.length} 条记录</p>
	</div>
	{#if data.user.role === 'operator' || data.user.role === 'tournament'}
		<a href="/time-gifts/new" class="btn btn-primary">新建赠送</a>
	{/if}
</div>

<div class="filter-bar">
	<a href="/time-gifts" class="btn btn-sm" class:btn-primary={!data.currentStatus}>全部</a>
	<a href="/time-gifts?status=pending" class="btn btn-sm" class:btn-primary={data.currentStatus === 'pending'}>待审核</a>
	<a href="/time-gifts?status=approved" class="btn btn-sm" class:btn-primary={data.currentStatus === 'approved'}>已通过</a>
	<a href="/time-gifts?status=rejected" class="btn btn-sm" class:btn-primary={data.currentStatus === 'rejected'}>复核不通过</a>
</div>

<div class="card">
	<div class="card-body" style="padding:0;">
		{#if data.timeGifts.length === 0}
			<div class="empty-state">
				<div class="icon">⏱️</div>
				<p>暂无赠送记录</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>会员</th>
						<th>时长</th>
						<th>原因</th>
						<th>来源</th>
						<th>提交人</th>
						<th>审核人</th>
						<th>状态</th>
						<th>提交时间</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.timeGifts as g}
						<tr>
							<td>{(g as any).id}</td>
							<td><a href="/members/{(g as any).member_id}" style="font-weight:500;">{(g as any).member_name}</a></td>
							<td style="font-weight:500;">{(g as any).minutes}分钟</td>
							<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title={(g as any).reason}>{(g as any).reason}</td>
							<td>{sourceLabels[(g as any).source_type] || (g as any).source_type}</td>
							<td>{(g as any).operator_name}</td>
							<td>{(g as any).reviewer_name || '-'}</td>
							<td><span class="status-badge status-{(g as any).status}">{statusLabels[(g as any).status]}</span></td>
							<td style="font-size:12px;color:var(--c-text-2);">{formatTime((g as any).created_at)}</td>
							<td><a href="/time-gifts/{(g as any).id}" class="btn btn-sm">详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
