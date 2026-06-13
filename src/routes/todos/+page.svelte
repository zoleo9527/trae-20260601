<script lang="ts">
	import { onMount } from 'svelte';

	let todos: any[] = [];
	let loading = true;
	let filterStatus = 'pending';

	onMount(async () => {
		await loadTodos();
	});

	async function loadTodos() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filterStatus) params.append('status', filterStatus);

			const res = await fetch(`/api/todos?${params}`);
			const data = await res.json();
			todos = data.data || [];
		} catch (e) {
			console.error(e);
		}
		loading = false;
	}

	async function completeTodo(todoId: number) {
		try {
			await fetch(`/api/todos/${todoId}/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note: '已完成' })
			});
			await loadTodos();
		} catch (e) {
			alert('完成失败');
		}
	}

	function handleFilterChange() {
		loadTodos();
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

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="container">
	<h1>我的待办</h1>

	<div class="filter-bar">
		<div class="filter-group">
			<label class="label">状态</label>
			<select class="input" bind:value={filterStatus} on:change={handleFilterChange}>
				<option value="">全部</option>
				<option value="pending">待处理</option>
				<option value="processing">处理中</option>
				<option value="completed">已完成</option>
			</select>
		</div>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else if todos.length > 0}
		<div class="todo-list">
			{#each todos as todo}
				<div class="todo-card">
					<div class="todo-header">
						<div class="todo-meta">
							<a href="/risk-alerts/{todo.risk_alert_id}" class="todo-code">{todo.code}</a>
							<span class="badge badge-{todo.priority || 'medium'}">
								{#if todo.priority === 'high'}
									高优先级
								{:else if todo.priority === 'medium'}
									中优先级
								{:else}
									低优先级
								{/if}
							</span>
							<span class="todo-type">{getTodoTypeLabel(todo.todo_type)}</span>
						</div>
						<div class="todo-actions">
							{#if todo.status !== 'completed'}
								<a href="/risk-alerts/{todo.risk_alert_id}" class="btn btn-primary btn-sm">处理</a>
								<button class="btn btn-secondary btn-sm" on:click={() => completeTodo(todo.id)}>完成</button>
							{:else}
								<span class="completed-badge">已完成</span>
							{/if}
						</div>
					</div>
					<div class="todo-body">
						<div class="todo-title">{todo.title}</div>
						<div class="todo-info">
							<span class="info-item">
								<span class="info-label">风险类型：</span>
								<span class="info-value">{getTypeLabel(todo.type)}</span>
							</span>
							<span class="info-item">
								<span class="info-label">风险状态：</span>
								<span class="status-badge status-{todo.risk_status}">{todo.risk_status}</span>
							</span>
							<span class="info-item">
								<span class="info-label">创建时间：</span>
								<span class="info-value">{formatDate(todo.created_at)}</span>
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<div class="empty-icon">✓</div>
			<div class="empty-text">暂无待办事项</div>
			<div class="empty-desc">所有任务都已处理完成</div>
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

	.filter-bar {
		background: var(--card-bg);
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.todo-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.todo-card {
		background: var(--card-bg);
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s;
	}

	.todo-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.todo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.todo-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.todo-code {
		color: var(--primary-color);
		font-weight: 600;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.todo-code:hover {
		text-decoration: underline;
	}

	.todo-type {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
	}

	.todo-actions {
		display: flex;
		gap: 0.5rem;
	}

	.todo-body {
		padding-top: 0.5rem;
	}

	.todo-title {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	.todo-info {
		display: flex;
		gap: 1.5rem;
		font-size: 0.875rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.info-label {
		color: var(--text-secondary);
	}

	.info-value {
		color: var(--text-primary);
	}

	.completed-badge {
		font-size: 0.75rem;
		color: #10b981;
		padding: 0.25rem 0.75rem;
		background: #d1fae5;
		border-radius: 0.25rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--card-bg);
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.empty-icon {
		font-size: 3rem;
		color: #10b981;
		margin-bottom: 1rem;
	}

	.empty-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.empty-desc {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}

	a {
		text-decoration: none;
	}
</style>