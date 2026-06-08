<script lang="ts">
	let { data } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消'
	};
	const paymentLabels: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
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
	<a href="/recharges" class="btn btn-sm" class:btn-primary={!data.currentStatus}>全部</a>
	<a href="/recharges?status=pending" class="btn btn-sm" class:btn-primary={data.currentStatus === 'pending'}>待审核</a>
	<a href="/recharges?status=approved" class="btn btn-sm" class:btn-primary={data.currentStatus === 'approved'}>已通过</a>
	<a href="/recharges?status=rejected" class="btn btn-sm" class:btn-primary={data.currentStatus === 'rejected'}>已退回</a>
</div>

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
