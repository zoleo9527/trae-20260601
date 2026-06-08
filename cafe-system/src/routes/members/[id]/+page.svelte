<script lang="ts">
	let { data } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消',
		registered: '已报名', checked_in: '已签到', eliminated: '已淘汰', won: '冠军'
	};
	const actionLabels: Record<string, string> = {
		create: '提交', approve: '审核通过', reject: '退回/复核不通过', cancel: '取消',
		register: '报名', checkin: '签到', assign: '指派', resolve: '修复', end: '下机'
	};
	const entityTypeLabels: Record<string, string> = {
		recharge: '充值', time_gift: '赠送', session: '上机', equipment: '维修',
		tournament: '赛事', tournament_reg: '赛事报名', member: '会员'
	};
	const entityLinks: Record<string, string> = {
		recharge: '/recharges', time_gift: '/time-gifts', session: '/sessions',
		equipment: '/equipment', tournament: '/tournaments', tournament_reg: '/tournaments', member: '/members'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}

	let activeTab = $state('timeline');

	const sourceLabels: Record<string, string> = {
		manual: '手动', tournament: '赛事', promotion: '活动', recharge_bonus: '充值赠送'
	};

	let pendingRecharges = $derived(data.recharges.filter((r: any) => r.status === 'pending').length);
	let pendingGifts = $derived(data.timeGifts.filter((g: any) => g.status === 'pending').length);
	let rejectedRecharges = $derived(data.recharges.filter((r: any) => r.status === 'rejected').length);
	let rejectedGifts = $derived(data.timeGifts.filter((g: any) => g.status === 'rejected').length);
	let linkedRecords = $derived(
		data.recharges
			.filter((r: any) => r.bonus_minutes > 0 && r.linked_gift_id)
			.map((r: any) => {
				const gift = data.timeGifts.find((g: any) => g.id === r.linked_gift_id) as any;
				return { recharge: r, gift };
			})
	);
</script>

<svelte:head>
	<title>{data.member.name} - 会员详情</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>{data.member.name}</h2>
		<p class="subtitle">手机：{data.member.phone || '未填写'} | 余额：¥{data.member.balance.toFixed(2)} | 赠送时长：{data.member.bonus_minutes}分钟</p>
	</div>
	<a href="/members" class="btn">返回会员列表</a>
</div>

{#if pendingRecharges > 0 || pendingGifts > 0 || rejectedRecharges > 0 || rejectedGifts > 0}
	<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
		{#if pendingRecharges > 0}
			<div class="alert alert-warning" style="margin:0;padding:8px 14px;font-size:13px;">
				{pendingRecharges} 笔充值待审核
			</div>
		{/if}
		{#if pendingGifts > 0}
			<div class="alert alert-warning" style="margin:0;padding:8px 14px;font-size:13px;">
				{pendingGifts} 笔赠送待审核
			</div>
		{/if}
		{#if rejectedRecharges > 0}
			<div class="alert alert-danger" style="margin:0;padding:8px 14px;font-size:13px;">
				{rejectedRecharges} 笔充值被退回
			</div>
		{/if}
		{#if rejectedGifts > 0}
			<div class="alert alert-danger" style="margin:0;padding:8px 14px;font-size:13px;">
				{rejectedGifts} 笔赠送复核不通过
			</div>
		{/if}
	</div>
{/if}

{#if linkedRecords.length > 0}
	<div class="alert alert-info" style="margin-bottom:20px;padding:10px 14px;font-size:13px;">
		<strong>充值与赠送关联：</strong>
		{#each linkedRecords as rec, i}
			{#if i > 0}；{/if}
			充值单#{rec.recharge.id} (¥{rec.recharge.amount.toFixed(2)}) → 赠送#{rec.gift?.id} ({rec.gift?.minutes}分钟, {statusLabels[rec.gift?.status] || rec.gift?.status})
		{/each}
	</div>
{/if}

<div style="display:flex;gap:8px;margin-bottom:20px;">
	<button class="btn" class:btn-primary={activeTab === 'timeline'} onclick={() => activeTab = 'timeline'}>操作时间线</button>
	<button class="btn" class:btn-primary={activeTab === 'recharges'} onclick={() => activeTab = 'recharges'}>充值记录 ({data.recharges.length})</button>
	<button class="btn" class:btn-primary={activeTab === 'gifts'} onclick={() => activeTab = 'gifts'}>赠送记录 ({data.timeGifts.length})</button>
	<button class="btn" class:btn-primary={activeTab === 'sessions'} onclick={() => activeTab = 'sessions'}>上机记录 ({data.sessions.length})</button>
	<button class="btn" class:btn-primary={activeTab === 'tournaments'} onclick={() => activeTab = 'tournaments'}>赛事 ({data.regs.length})</button>
</div>

{#if activeTab === 'timeline'}
	<div class="card">
		<div class="card-header">操作时间线</div>
		<div class="card-body">
			{#if data.logs.length === 0}
				<div class="empty-state"><p>暂无操作记录</p></div>
			{:else}
				<div class="timeline">
					{#each data.logs as log}
						<div class="timeline-item {(log as any).action}">
							<div class="tl-time">{formatTime((log as any).created_at)}</div>
							<div class="tl-action">
								{(log as any).operator_name} —
								{#if (log as any).entity_type && entityLinks[(log as any).entity_type]}
									<a href="{entityLinks[(log as any).entity_type]}/{(log as any).entity_id}" style="font-size:12px;margin-right:4px;">[{entityTypeLabels[(log as any).entity_type] || (log as any).entity_type}#{(log as any).entity_id}]</a>
								{/if}
								{actionLabels[(log as any).action] || (log as any).action}
							</div>
							<div class="tl-detail">{#if (log as any).entity_type === 'time_gift' && (log as any).source_type === 'recharge_bonus'}<span style="color:var(--c-primary);font-weight:500;margin-right:4px;">[关联充值]</span>{/if}{(log as any).detail}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else if activeTab === 'recharges'}
	<div class="card">
		<div class="card-header">充值记录</div>
		<div class="card-body" style="padding:0;">
			{#if data.recharges.length === 0}
				<div class="empty-state"><p>暂无充值记录</p></div>
			{:else}
				<table>
					<thead>
						<tr><th>ID</th><th>金额</th><th>赠送时长</th><th>支付方式</th><th>操作人</th><th>状态</th><th>时间</th><th></th></tr>
					</thead>
					<tbody>
						{#each data.recharges as r}
							<tr>
								<td>{(r as any).id}</td>
								<td>¥{(r as any).amount.toFixed(2)}</td>
								<td>{(r as any).bonus_minutes > 0 ? (r as any).bonus_minutes + '分钟' : '-'}</td>
								<td>{(r as any).payment_method === 'cash' ? '现金' : (r as any).payment_method === 'wechat' ? '微信' : '支付宝'}</td>
								<td>{(r as any).operator_name}</td>
								<td><span class="status-badge status-{(r as any).status}">{statusLabels[(r as any).status]}</span></td>
								<td style="font-size:12px;color:var(--c-text-2);">{formatTime((r as any).created_at)}</td>
								<td>
									<a href="/recharges/{(r as any).id}" class="btn btn-sm">详情</a>
									{#if (r as any).bonus_minutes > 0 && (r as any).linked_gift_id}
										<a href="/time-gifts/{(r as any).linked_gift_id}" style="font-size:11px;color:var(--c-primary);margin-left:6px;">关联赠送 →</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
{:else if activeTab === 'gifts'}
	<div class="card">
		<div class="card-header">赠送记录</div>
		<div class="card-body" style="padding:0;">
			{#if data.timeGifts.length === 0}
				<div class="empty-state"><p>暂无赠送记录</p></div>
			{:else}
				<table>
					<thead>
						<tr><th>ID</th><th>时长</th><th>原因</th><th>来源</th><th>操作人</th><th>状态</th><th>时间</th><th></th></tr>
					</thead>
					<tbody>
						{#each data.timeGifts as g}
							<tr>
								<td>{(g as any).id}</td>
								<td>{(g as any).minutes}分钟</td>
								<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title={(g as any).reason}>{(g as any).reason}</td>
								<td>{sourceLabels[(g as any).source_type] || (g as any).source_type}</td>
								<td>{(g as any).operator_name}</td>
								<td><span class="status-badge status-{(g as any).status}">{statusLabels[(g as any).status]}</span></td>
								<td style="font-size:12px;color:var(--c-text-2);">{formatTime((g as any).created_at)}</td>
								<td>
									<a href="/time-gifts/{(g as any).id}" class="btn btn-sm">详情</a>
									{#if (g as any).source_type === 'recharge_bonus' && (g as any).recharge_id}
										<a href="/recharges/{(g as any).recharge_id}" style="font-size:11px;color:var(--c-primary);margin-left:6px;">关联充值 →</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
{:else if activeTab === 'sessions'}
	<div class="card">
		<div class="card-header">上机记录</div>
		<div class="card-body" style="padding:0;">
			{#if data.sessions.length === 0}
				<div class="empty-state"><p>暂无上机记录</p></div>
			{:else}
				<table>
					<thead>
						<tr><th>机位</th><th>开始时间</th><th>结束时间</th><th>时长</th><th>登记人</th></tr>
					</thead>
					<tbody>
						{#each data.sessions as s}
							<tr>
								<td style="font-weight:500;">{(s as any).computer_id}</td>
								<td>{formatTime((s as any).start_time)}</td>
								<td>
									{#if (s as any).end_time}
										{formatTime((s as any).end_time)}
									{:else}
										<span class="status-badge status-ongoing">使用中</span>
									{/if}
								</td>
								<td>{(s as any).duration_minutes ? (s as any).duration_minutes + '分钟' : '-'}</td>
								<td>{(s as any).operator_name}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
{:else if activeTab === 'tournaments'}
	<div class="card">
		<div class="card-header">赛事参与</div>
		<div class="card-body" style="padding:0;">
			{#if data.regs.length === 0}
				<div class="empty-state"><p>暂无赛事记录</p></div>
			{:else}
				<table>
					<thead>
						<tr><th>赛事</th><th>游戏</th><th>状态</th><th>报名时间</th><th></th></tr>
					</thead>
					<tbody>
						{#each data.regs as r}
							<tr>
								<td style="font-weight:500;">{(r as any).tournament_name}</td>
								<td>{(r as any).game}</td>
								<td><span class="status-badge status-{(r as any).status}">{statusLabels[(r as any).status]}</span></td>
								<td style="font-size:12px;color:var(--c-text-2);">{formatTime((r as any).registered_at)}</td>
								<td><a href="/tournaments/{(r as any).tournament_id}" class="btn btn-sm">赛事</a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
{/if}
