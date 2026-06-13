<script lang="ts">
	import { onMount } from 'svelte';

	let stats: any = null;
	let myTodos: any[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const statsRes = await fetch('/api/dashboard/stats');
			stats = await statsRes.json();

			const todosRes = await fetch('/api/todos?status=pending');
			const todosData = await todosRes.json();
			myTodos = todosData.data || [];
		} catch (e) {
			console.error(e);
		}
		loading = false;
	});

	function getTypeLabel(type: string): string {
		const labels = {
			policy_dispute: '政策适用争议',
			draft_version_chaos: '底稿版本混乱',
			response_unsigned: '答复未签收',
			missing_docs: '补充资料缺失',
			deadline_risk: '申报期限风险',
			system_error: '系统操作异常'
		};
		return labels[type] || type;
	}

	function getTodoTypeLabel(todoType: string): string {
		const labels = {
			risk_process: '风险处理',
			review_confirm: '审核确认',
			sign_receive: '签收确认',
			supplement_docs: '补充资料',
			follow_up: '后续跟踪'
		};
		return labels[todoType] || todoType;
	}
</script>

<div class="container">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<h1>仪表盘</h1>

		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-number">{stats?.total || 0}</div>
				<div class="stat-label">总风险提示</div>
			</div>
			<div class="stat-card stat-pending">
				<div class="stat-number">{stats?.pending || 0}</div>
				<div class="stat-label">待处理</div>
			</div>
			<div class="stat-card stat-processing">
				<div class="stat-number">{stats?.processing || 0}</div>
				<div class="stat-label">处理中</div>
			</div>
			<div class="stat-card stat-confirming">
				<div class="stat-number">{stats?.confirming || 0}</div>
				<div class="stat-label">待确认</div>
			</div>
			<div class="stat-card stat-completed">
				<div class="stat-number">{stats?.completed || 0}</div>
				<div class="stat-label">已完成</div>
			</div>
			<div class="stat-card stat-closed">
				<div class="stat-number">{stats?.closed || 0}</div>
				<div class="stat-label">已关闭</div>
			</div>
		</div>

		<div class="grid grid-cols-2">
			<div class="card">
				<h2>按紧急度分布</h2>
				<div class="severity-bars">
					<div class="severity-item">
						<div class="severity-label">
							<span class="badge badge-high">高风险</span>
						</div>
						<div class="severity-bar">
							<div class="severity-fill high" style="width: {(stats?.bySeverity?.high || 0) / (stats?.total || 1) * 100}%"></div>
						</div>
						<div class="severity-count">{stats?.bySeverity?.high || 0}</div>
					</div>
					<div class="severity-item">
						<div class="severity-label">
							<span class="badge badge-medium">中风险</span>
						</div>
						<div class="severity-bar">
							<div class="severity-fill medium" style="width: {(stats?.bySeverity?.medium || 0) / (stats?.total || 1) * 100}%"></div>
						</div>
						<div class="severity-count">{stats?.bySeverity?.medium || 0}</div>
					</div>
					<div class="severity-item">
						<div class="severity-label">
							<span class="badge badge-low">低风险</span>
						</div>
						<div class="severity-bar">
							<div class="severity-fill low" style="width: {(stats?.bySeverity?.low || 0) / (stats?.total || 1) * 100}%"></div>
						</div>
						<div class="severity-count">{stats?.bySeverity?.low || 0}</div>
					</div>
				</div>
			</div>

			<div class="card">
				<h2>按类型分布</h2>
				<div class="type-list">
					{#if stats?.byType}
						{#each Object.entries(stats.byType) as [type, count]}
							<div class="type-item">
								<div class="type-label">{getTypeLabel(type)}</div>
								<div class="type-count">{count}</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h2>我的待办</h2>
				<a href="/todos" class="btn btn-secondary btn-sm">查看全部</a>
			</div>
			{#if myTodos.length > 0}
				<table class="table">
					<thead>
						<tr>
							<th>风险编号</th>
							<th>标题</th>
							<th>待办类型</th>
							<th>紧急度</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each myTodos.slice(0, 5) as todo}
							<tr>
								<td><a href="/risk-alerts/{todo.risk_alert_id}">{todo.code}</a></td>
								<td>{todo.title}</td>
								<td>{getTodoTypeLabel(todo.todo_type)}</td>
								<td>
									<span class="badge badge-{todo.priority || 'medium'}">
										{#if todo.priority === 'high'}
											高
										{:else if todo.priority === 'medium'}
											中
										{:else}
											低
										{/if}
									</span>
								</td>
								<td>
									<a href="/risk-alerts/{todo.risk_alert_id}" class="btn btn-primary btn-sm">处理</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="empty-state">暂无待办事项</div>
			{/if}
		</div>

		<div class="actions">
			<a href="/risk-alerts/new" class="btn btn-primary">新建风险提示</a>
			<a href="/risk-alerts" class="btn btn-secondary">查看全部风险提示</a>
		</div>
	{/if}
</div>

<style>
	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: var(--card-bg);
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.stat-pending .stat-number {
		color: #f59e0b;
	}

	.stat-processing .stat-number {
		color: #3b82f6;
	}

	.stat-confirming .stat-number {
		color: #8b5cf6;
	}

	.stat-completed .stat-number {
		color: #10b981;
	}

	.stat-closed .stat-number {
		color: #6b7280;
	}

	.grid-cols-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.severity-bars {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.severity-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.severity-label {
		min-width: 80px;
	}

	.severity-bar {
		flex: 1;
		height: 24px;
		background: #f3f4f6;
		border-radius: 0.25rem;
		position: relative;
	}

	.severity-fill {
		height: 100%;
		border-radius: 0.25rem;
		transition: width 0.3s;
	}

	.severity-fill.high {
		background: #fee2e2;
	}

	.severity-fill.medium {
		background: #fef3c7;
	}

	.severity-fill.low {
		background: #d1fae5;
	}

	.severity-count {
		min-width: 40px;
		text-align: right;
		font-weight: 600;
	}

	.type-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.type-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color);
	}

	.type-label {
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.type-count {
		font-weight: 600;
		color: var(--primary-color);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h2 {
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	a {
		text-decoration: none;
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}
</style>