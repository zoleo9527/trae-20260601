<script lang="ts">
	let { data } = $props();

	const roleLabels: Record<string, string> = {
		admin: '店长',
		operator: '网管',
		tournament: '赛事运营'
	};

	const statusLabels: Record<string, string> = {
		pending: '待审核',
		approved: '已通过',
		rejected: '已退回',
		cancelled: '已取消',
		upcoming: '未开始',
		ongoing: '进行中',
		completed: '已结束',
		reported: '已报修',
		in_progress: '维修中'
	};

	type Step = { label: string; href?: string };

	const normalFlows: Record<string, { title: string; steps: Step[] }> = {
		admin: {
			title: '正常推进路径',
			steps: [
				{ label: '查看待审核充值', href: '/recharges?status=pending' },
				{ label: '审核充值详情', href: '/recharges/4' },
				{ label: '审核通过' },
				{ label: '关联赠送自动通过', href: '/time-gifts/3' }
			]
		},
		operator: {
			title: '正常推进路径',
			steps: [
				{ label: '新建充值', href: '/recharges/new' },
				{ label: '查看充值详情', href: '/recharges/4' },
				{ label: '等待店长审核' },
				{ label: '审核通过后余额到账', href: '/recharges/1' }
			]
		},
		tournament: {
			title: '正常推进路径',
			steps: [
				{ label: '创建赛事', href: '/tournaments' },
				{ label: '会员报名', href: '/tournaments/1' },
				{ label: '发放赛事奖励', href: '/time-gifts/new' },
				{ label: '店长复核通过', href: '/time-gifts/5' }
			]
		}
	};

	const exceptionFlows: Record<string, { title: string; steps: Step[] }> = {
		admin: {
			title: '异常处理路径',
			steps: [
				{ label: '发现赠送异常', href: '/time-gifts/6' },
				{ label: '退回并填写原因' },
				{ label: '提交人收到退回通知', href: '/time-gifts/4' },
				{ label: '确认重新提交后审核', href: '/time-gifts/new' }
			]
		},
		operator: {
			title: '异常处理路径',
			steps: [
				{ label: '提交充值+赠送', href: '/recharges/5' },
				{ label: '店长退回', href: '/recharges/5' },
				{ label: '查看退回原因' },
				{ label: '重新提交', href: '/recharges/new' }
			]
		},
		tournament: {
			title: '异常处理路径',
			steps: [
				{ label: '提交赛事时长赠送', href: '/time-gifts/6' },
				{ label: '复核不通过(赛事未结束)' },
				{ label: '查看不通过原因' },
				{ label: '等赛事结束后重新提交', href: '/time-gifts/new' }
			]
		}
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>仪表盘 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>工作台</h2>
		<p class="subtitle">当前身份：{roleLabels[data.role]}</p>
	</div>
</div>

<div class="demo-path-section">
	<h3 class="demo-path-title">演示路径</h3>
	<div class="demo-path-grid">
		{#if normalFlows[data.role]}
			<div class="demo-path-card demo-path-normal">
				<div class="demo-path-card-title">{normalFlows[data.role].title}</div>
				<div class="flow-steps">
					{#each normalFlows[data.role].steps as step, i}
						<div class="flow-step">
							{#if step.href}
								<a href={step.href} class="step-pill step-pill-link">{step.label}</a>
							{:else}
								<span class="step-pill step-pill-status">{step.label}</span>
							{/if}
							{#if i < normalFlows[data.role].steps.length - 1}
								<span class="step-arrow">→</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
		{#if exceptionFlows[data.role]}
			<div class="demo-path-card demo-path-exception">
				<div class="demo-path-card-title">{exceptionFlows[data.role].title}</div>
				<div class="flow-steps">
					{#each exceptionFlows[data.role].steps as step, i}
						<div class="flow-step">
							{#if step.href}
								<a href={step.href} class="step-pill step-pill-link">{step.label}</a>
							{:else}
								<span class="step-pill step-pill-status">{step.label}</span>
							{/if}
							{#if i < exceptionFlows[data.role].steps.length - 1}
								<span class="step-arrow">→</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

{#if data.role === 'admin'}
	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-warning)">{data.stats.pendingRecharges}</div>
			<div class="stat-label">待审核充值</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-warning)">{data.stats.pendingTimeGifts}</div>
			<div class="stat-label">待审核赠送</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.rejectedRecharges}</div>
			<div class="stat-label">已退回充值</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.rejectedTimeGifts}</div>
			<div class="stat-label">已退回赠送</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.stats.totalMembers}</div>
			<div class="stat-label">会员总数</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.stats.activeSessions}</div>
			<div class="stat-label">当前上机</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.ongoingRepairs}</div>
			<div class="stat-label">设备待修</div>
		</div>
	</div>

	<div class="action-grid">
		<a href="/recharges?status=pending" class="action-card">
			<div class="action-title">充值审核</div>
			<div class="action-desc">审核网管提交的会员充值申请</div>
		</a>
		<a href="/time-gifts?status=pending" class="action-card">
			<div class="action-title">赠送审核</div>
			<div class="action-desc">审核时长赠送申请，确认责任归属</div>
		</a>
		<a href="/recharges" class="action-card">
			<div class="action-title">充值记录</div>
			<div class="action-desc">查看所有充值及审核历史</div>
		</a>
		<a href="/time-gifts" class="action-card">
			<div class="action-title">赠送记录</div>
			<div class="action-desc">查看所有时长赠送及复核历史</div>
		</a>
	</div>
{:else if data.role === 'operator'}
	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-value">{data.stats.totalMembers}</div>
			<div class="stat-label">会员总数</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.stats.activeSessions}</div>
			<div class="stat-label">当前上机</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.ongoingRepairs}</div>
			<div class="stat-label">设备待修</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-warning)">{data.stats.pendingRecharges}</div>
			<div class="stat-label">我提交的待审核充值</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.rejectedRecharges}</div>
			<div class="stat-label">被退回的充值</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.rejectedTimeGifts}</div>
			<div class="stat-label">被退回的赠送</div>
		</div>
	</div>

	<div class="action-grid">
		<a href="/recharges/new" class="action-card">
			<div class="action-title">会员充值</div>
			<div class="action-desc">为会员办理充值，充值金额与赠送时长需审核</div>
		</a>
		<a href="/time-gifts/new" class="action-card">
			<div class="action-title">时长赠送</div>
			<div class="action-desc">为会员赠送上机时长，需说明原因并审核</div>
		</a>
		<a href="/sessions" class="action-card">
			<div class="action-title">上机记录</div>
			<div class="action-desc">查看和登记会员上机情况</div>
		</a>
		<a href="/equipment" class="action-card">
			<div class="action-title">设备报修</div>
			<div class="action-desc">报告设备故障并跟踪维修进度</div>
		</a>
	</div>
{:else if data.role === 'tournament'}
	<div class="stat-grid">
		<div class="stat-card">
			<div class="stat-value">{data.stats.upcomingTournaments}</div>
			<div class="stat-label">进行中/即将赛事</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-warning)">{data.stats.pendingTimeGifts}</div>
			<div class="stat-label">我提交的待审核赠送</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color:var(--c-danger)">{data.stats.rejectedTimeGifts}</div>
			<div class="stat-label">被退回的赠送</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.stats.totalMembers}</div>
			<div class="stat-label">会员总数</div>
		</div>
	</div>

	<div class="action-grid">
		<a href="/tournaments" class="action-card">
			<div class="action-title">赛事管理</div>
			<div class="action-desc">创建和管理电竞赛事，查看报名情况</div>
		</a>
		<a href="/time-gifts/new" class="action-card">
			<div class="action-title">赛事时长赠送</div>
			<div class="action-desc">为赛事获奖者发放时长奖励，需审核确认</div>
		</a>
		<a href="/members" class="action-card">
			<div class="action-title">会员查询</div>
			<div class="action-desc">查询会员信息和参赛记录</div>
		</a>
	</div>
{/if}

<div class="card" style="margin-top:8px;">
	<div class="card-header">
		<span>
			{#if data.role === 'admin'}待处理事项{:else}我最近的操作{/if}
		</span>
	</div>
	<div class="card-body" style="padding:0;">
		{#if data.recentItems.length === 0}
			<div class="empty-state">
				<div class="icon">📋</div>
				<p>暂无记录</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>类型</th>
						<th>会员</th>
						<th>详情</th>
						<th>状态</th>
						<th>时间</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentItems as item}
						<tr>
							<td>
								{#if (item as any).type === 'recharge'}
									<span style="color:var(--c-primary);font-weight:500;">充值</span>
								{:else if (item as any).type === 'time_gift'}
									<span style="color:var(--c-success);font-weight:500;">赠送</span>
								{:else}
									<span style="color:var(--c-warning);font-weight:500;">赛事</span>
								{/if}
							</td>
							<td>{(item as any).member_name || '-'}</td>
							<td>
								{#if (item as any).type === 'recharge'}
									金额 ¥{(item as any).amount}，赠送 {(item as any).bonus_minutes} 分钟
								{:else if (item as any).type === 'time_gift'}
									{(item as any).minutes} 分钟 — {(item as any).reason}
								{:else}
									{(item as any).name} — {(item as any).game}
								{/if}
							</td>
							<td><span class="status-badge status-{(item as any).status}">{statusLabels[(item as any).status] || (item as any).status}</span></td>
							<td style="color:var(--c-text-2);font-size:12px;">{formatTime((item as any).created_at || (item as any).start_time)}</td>
							<td>
								{#if (item as any).type === 'recharge'}
									<a href="/recharges/{(item as any).id}" class="btn btn-sm">查看</a>
								{:else if (item as any).type === 'time_gift'}
									<a href="/time-gifts/{(item as any).id}" class="btn btn-sm">查看</a>
								{:else}
									<a href="/tournaments/{(item as any).id}" class="btn btn-sm">查看</a>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.demo-path-section {
		margin-bottom: 24px;
	}

	.demo-path-title {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 12px;
		color: var(--c-text);
	}

	.demo-path-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.demo-path-card {
		border-radius: var(--radius);
		padding: 20px;
		border: 1px solid var(--c-border);
		box-shadow: var(--shadow);
	}

	.demo-path-normal {
		background: #f0fdf4;
		border-color: #b2f2bb;
	}

	.demo-path-exception {
		background: #fff5f5;
		border-color: #ffc9c9;
	}

	.demo-path-card-title {
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 14px;
	}

	.demo-path-normal .demo-path-card-title {
		color: var(--c-success);
	}

	.demo-path-exception .demo-path-card-title {
		color: var(--c-danger);
	}

	.flow-steps {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}

	.flow-step {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.step-pill {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
	}

	.step-pill-link {
		background: var(--c-primary);
		color: #fff;
		text-decoration: none;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.step-pill-link:hover {
		opacity: 0.85;
	}

	.demo-path-normal .step-pill-link {
		background: var(--c-success);
	}

	.demo-path-exception .step-pill-link {
		background: var(--c-danger);
	}

	.step-pill-status {
		background: var(--c-bg-2);
		color: var(--c-text-2);
		border: 1px dashed var(--c-border);
	}

	.step-arrow {
		color: var(--c-text-2);
		font-size: 16px;
		font-weight: 700;
		margin: 0 2px;
	}

	@media (max-width: 768px) {
		.demo-path-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
