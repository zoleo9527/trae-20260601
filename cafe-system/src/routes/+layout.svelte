<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let { data, children } = $props();

	let user = $derived(data.user);
	let currentPath = $derived($page.url.pathname);
	let pendingRecharges = $derived(data.pendingRecharges ?? 0);
	let pendingTimeGifts = $derived(data.pendingTimeGifts ?? 0);
	let pendingRepairs = $derived(data.pendingRepairs ?? 0);
	let pendingTotal = $derived(pendingRecharges + pendingTimeGifts);

	const roleLabels: Record<string, string> = {
		admin: '店长',
		operator: '网管',
		tournament: '赛事运营'
	};

	function navClass(path: string) {
		return 'nav-item' + (currentPath === path || currentPath.startsWith(path + '/') ? ' active' : '');
	}
</script>

{#if user}
	<div class="app-layout">
		<aside class="sidebar">
			<div class="sidebar-brand">
				<h1>网咖电竞馆</h1>
				<p>会员充值与时长赠送管理</p>
			</div>

			<nav class="sidebar-nav">
				<div class="nav-section">工作台</div>
				<a href="/dashboard" class={navClass('/dashboard')}>
					📊 仪表盘
					<span class="nav-sub">数据概览与快速入口</span>
				</a>
				<a href="/dashboard" class={navClass('/dashboard')}>
					🚀 演示路径
					<span class="nav-sub">快速体验系统功能</span>
				</a>

				{#if user.role === 'admin'}
					<div class="nav-section nav-section-highlight">🔔 待我处理</div>
					<a href="/recharges?status=pending" class={navClass('/recharges')}>
						💰 充值审核
						<span class="nav-sub">待审核充值申请</span>
						{#if pendingRecharges > 0}
							<span class="badge">{pendingRecharges}</span>
						{/if}
					</a>
					<a href="/time-gifts?status=pending" class={navClass('/time-gifts')}>
						⏱ 赠送审核
						<span class="nav-sub">待审核赠送申请</span>
						{#if pendingTimeGifts > 0}
							<span class="badge">{pendingTimeGifts}</span>
						{/if}
					</a>
					<a href="/equipment" class={navClass('/equipment')}>
						🔧 设备指派
						<span class="nav-sub">待指派维修任务</span>
						{#if pendingRepairs > 0}
							<span class="badge">{pendingRepairs}</span>
						{/if}
					</a>
					<div class="nav-separator"></div>
					<div class="nav-section review-center">📋 审核中心{#if pendingTotal > 0}<span class="review-total">{pendingTotal}</span>{/if}</div>
					<a href="/recharges?status=pending" class={navClass('/recharges')}>
						💰 充值审核
						<span class="nav-sub">审核会员充值申请</span>
						{#if pendingRecharges > 0}
							<span class="badge">{pendingRecharges}</span>
						{/if}
					</a>
					<a href="/time-gifts?status=pending" class={navClass('/time-gifts')}>
						⏱ 赠送审核
						<span class="nav-sub">审核时长赠送申请</span>
						{#if pendingTimeGifts > 0}
							<span class="badge">{pendingTimeGifts}</span>
						{/if}
					</a>
				{/if}

				{#if user.role === 'operator'}
					<div class="nav-section nav-section-highlight">🔔 待我处理</div>
					<a href="/recharges?status=pending&submitter=me" class={navClass('/recharges')}>
						💰 我提交的充值
						<span class="nav-sub">待审核</span>
						{#if pendingRecharges > 0}
							<span class="badge">{pendingRecharges}</span>
						{/if}
					</a>
					<a href="/time-gifts?status=pending&submitter=me" class={navClass('/time-gifts')}>
						⏱ 我提交的赠送
						<span class="nav-sub">待审核</span>
						{#if pendingTimeGifts > 0}
							<span class="badge">{pendingTimeGifts}</span>
						{/if}
					</a>
					<a href="/equipment" class={navClass('/equipment')}>
						🔧 设备报修
						<span class="nav-sub">报修与维修跟踪</span>
						{#if pendingRepairs > 0}
							<span class="badge">{pendingRepairs}</span>
						{/if}
					</a>
					<div class="nav-separator"></div>
					<div class="nav-section">日常操作</div>
					<a href="/recharges/new" class={navClass('/recharges/new')}>
						💰 会员充值
						<span class="nav-sub">充值（含赠送时长）</span>
					</a>
					<a href="/time-gifts/new" class={navClass('/time-gifts/new')}>
						⏱ 时长赠送
						<span class="nav-sub">赠送会员上机时长</span>
					</a>
					<a href="/sessions" class={navClass('/sessions')}>
						🖥 上机记录
						<span class="nav-sub">查看会员上机情况</span>
					</a>
				{/if}

				{#if user.role === 'tournament'}
					<div class="nav-section nav-section-highlight">🔔 待我处理</div>
					<a href="/time-gifts?status=pending&submitter=me" class={navClass('/time-gifts')}>
						⏱ 我提交的赠送
						<span class="nav-sub">待审核</span>
						{#if pendingTimeGifts > 0}
							<span class="badge">{pendingTimeGifts}</span>
						{/if}
					</a>
					<a href="/tournaments" class={navClass('/tournaments')}>
						🏆 赛事管理
						<span class="nav-sub">管理电竞赛事</span>
					</a>
					<div class="nav-separator"></div>
					<div class="nav-section">赛事管理</div>
					<a href="/tournaments" class={navClass('/tournaments')}>
						🏆 赛事列表
						<span class="nav-sub">管理电竞赛事</span>
					</a>
					<a href="/time-gifts/new" class={navClass('/time-gifts/new')}>
						⏱ 赛事时长赠送
						<span class="nav-sub">为赛事获奖者发放时长，需店长复核</span>
					</a>
				{/if}

				<div class="nav-section">数据</div>
				<a href="/members" class={navClass('/members')}>
					👤 会员管理
					<span class="nav-sub">查询与管理会员信息</span>
				</a>

				{#if user.role === 'admin'}
					<a href="/recharges" class={navClass('/recharges')}>
						💰 充值记录
						<span class="nav-sub">全部充值流水</span>
					</a>
					<a href="/time-gifts" class={navClass('/time-gifts')}>
						⏱ 赠送记录
						<span class="nav-sub">全部赠送流水</span>
					</a>
					<a href="/sessions" class={navClass('/sessions')}>
						🖥 上机记录
						<span class="nav-sub">查看会员上机情况</span>
					</a>
					<a href="/tournaments" class={navClass('/tournaments')}>
						🏆 赛事管理
						<span class="nav-sub">管理电竞赛事</span>
					</a>
					<a href="/equipment" class={navClass('/equipment')}>
						🔧 设备维修
						<span class="nav-sub">报修与维修跟踪</span>
						{#if pendingRepairs > 0}
							<span class="badge">{pendingRepairs}</span>
						{/if}
					</a>
				{/if}
			</nav>

			<div class="sidebar-footer">
				<div class="sidebar-user">
					<div class="avatar">{user.display_name[0]}</div>
					<div class="info">
						<div class="name">{user.display_name}</div>
						<span class="role-tag">{roleLabels[user.role]}</span>
					</div>
					<form method="POST" action="/login">
						<input type="hidden" name="action" value="logout" />
						<button type="submit" class="logout-btn">退出</button>
					</form>
				</div>
			</div>
		</aside>

		<main class="main-content">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.nav-item {
		flex-wrap: wrap;
	}
	.nav-sub {
		width: 100%;
		font-size: 11px;
		color: rgba(193, 196, 208, 0.5);
		margin-top: -2px;
	}
	.nav-item.active .nav-sub {
		color: rgba(255, 255, 255, 0.55);
	}
	.nav-section-highlight {
		color: rgba(255, 200, 50, 0.9) !important;
	}
	.nav-separator {
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 8px 16px;
	}
	.review-center {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.review-total {
		background: var(--c-danger);
		color: #fff;
		font-size: 11px;
		padding: 1px 7px;
		border-radius: 10px;
		font-weight: 600;
	}
</style>
