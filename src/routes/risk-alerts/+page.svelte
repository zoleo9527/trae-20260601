<script lang="ts">
	import { onMount } from 'svelte';

	let riskAlerts: any[] = [];
	let total = 0;
	let page = 1;
	let loading = true;
	let expandedAlerts: Set<number> = new Set();
	let showQuickProcessModal = false;
	let quickProcessAlertId: number | null = null;
	let quickProcessAction = '';
	let quickProcessDescription = '';

	let filters = {
		status: '',
		type: '',
		severity: ''
	};

	onMount(async () => {
		await loadRiskAlerts();
	});

	async function loadRiskAlerts() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filters.status) params.append('status', filters.status);
			if (filters.type) params.append('type', filters.type);
			if (filters.severity) params.append('severity', filters.severity);
			params.append('page', String(page));

			const res = await fetch(`/api/risk-alerts?${params}`);
			const data = await res.json();
			riskAlerts = data.data || [];
			total = data.total || 0;
		} catch (e) {
			console.error(e);
		}
		loading = false;
	}

	function handleFilterChange() {
		page = 1;
		loadRiskAlerts();
	}

	function toggleExpand(alertId: number) {
		if (expandedAlerts.has(alertId)) {
		 expandedAlerts.delete(alertId);
		} else {
			expandedAlerts.add(alertId);
		}
		expandedAlerts = expandedAlerts;
	}

	function openQuickProcess(alertId: number) {
		quickProcessAlertId = alertId;
		quickProcessAction = '';
		quickProcessDescription = '';
		showQuickProcessModal = true;
	}

	async function handleQuickProcess() {
		if (!quickProcessAction) {
			alert('请选择处理动作');
			return;
		}

		try {
			await fetch(`/api/risk-alerts/${quickProcessAlertId}/process`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: quickProcessAction,
					description: quickProcessDescription
				})
			});

			showQuickProcessModal = false;
			quickProcessAlertId = null;
			quickProcessAction = '';
			quickProcessDescription = '';
			await loadRiskAlerts();
		} catch (e) {
			alert('处理失败');
		}
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

	function getStatusLabel(status: string): string {
		const labels = {
			pending: '待处理',
			processing: '处理中',
			confirming: '待确认',
			completed: '已完成',
			closed: '已关闭'
		};
		return labels[status] || status;
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
	<h1>风险提示列表</h1>

	<div class="filters">
		<div class="filter-group">
			<label class="label">状态</label>
			<select class="input" bind:value={filters.status} on:change={handleFilterChange}>
				<option value="">全部</option>
				<option value="pending">待处理</option>
				<option value="processing">处理中</option>
				<option value="confirming">待确认</option>
				<option value="completed">已完成</option>
				<option value="closed">已关闭</option>
			</select>
		</div>

		<div class="filter-group">
			<label class="label">类型</label>
			<select class="input" bind:value={filters.type} on:change={handleFilterChange}>
				<option value="">全部</option>
				<option value="policy_dispute">政策适用争议</option>
				<option value="draft_version_chaos">底稿版本混乱</option>
				<option value="response_unsigned">答复未签收</option>
				<option value="missing_docs">补充资料缺失</option>
				<option value="deadline_risk">申报期限风险</option>
				<option value="system_error">系统操作异常</option>
			</select>
		</div>

		<div class="filter-group">
			<label class="label">紧急度</label>
			<select class="input" bind:value={filters.severity} on:change={handleFilterChange}>
				<option value="">全部</option>
				<option value="high">高风险</option>
				<option value="medium">中风险</option>
				<option value="low">低风险</option>
			</select>
		</div>

		<div class="filter-actions">
			<a href="/risk-alerts/new" class="btn btn-primary">新建风险提示</a>
		</div>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else if riskAlerts.length > 0}
		<div class="alert-list">
			{#each riskAlerts as alert}
				<div class="alert-card">
					<div class="card-header">
						<div class="header-left">
							<a href="/risk-alerts/{alert.id}" class="code-link">{alert.code}</a>
							<span class="badge badge-{alert.severity}">
								{#if alert.severity === 'high'}
									🔴 高
								{:else if alert.severity === 'medium'}
									🟡 中
								{:else}
									🟢 低
								{/if}
							</span>
							<span class="status-badge status-{alert.status}">
								{getStatusLabel(alert.status)}
							</span>
						</div>
						<div class="header-right">
							{#if alert.status !== 'closed'}
								<button 
									class="btn btn-primary btn-sm" 
									on:click={() => openQuickProcess(alert.id)}
								>
									快捷处理
								</button>
							{/if}
							<button 
								class="btn btn-secondary btn-sm" 
								on:click={() => toggleExpand(alert.id)}
							>
								{#if expandedAlerts.has(alert.id)}
									收起详情
								{:else}
									展开详情
								{/if}
							</button>
							<a href="/risk-alerts/{alert.id}" class="btn btn-secondary btn-sm">查看完整</a>
						</div>
					</div>

					<div class="card-title">{alert.title}</div>
					
					<div class="card-meta">
						<span class="meta-item">
							<span class="meta-label">类型:</span>
							<span class="meta-value">{getTypeLabel(alert.type)}</span>
						</span>
						<span class="meta-item">
							<span class="meta-label">责任人:</span>
							<span class="meta-value">{alert.assignee_name || '-'}</span>
						</span>
						<span class="meta-item">
							<span class="meta-label">更新:</span>
							<span class="meta-value time">{formatDate(alert.updated_at)}</span>
						</span>
					</div>

					{#if alert.recentLogs && alert.recentLogs.length > 0}
						<div class="progress-section">
							<div class="progress-header">
								<span class="progress-title">📋 最近推进动作</span>
								<span class="progress-count">{alert.recentLogs.length} 条记录</span>
							</div>
							<div class="progress-timeline">
								{#each alert.recentLogs as log, i}
									<div class="timeline-item {i === 0 ? 'latest' : ''}">
										<div class="timeline-marker"></div>
										<div class="timeline-content">
											<div class="timeline-top">
												<span class="timeline-action">{log.action}</span>
												{#if log.user_name}
													<span class="timeline-user">{log.user_name}</span>
												{/if}
											</div>
											{#if log.description}
												<div class="timeline-desc">{log.description}</div>
											{/if}
											<div class="timeline-time">{formatDate(log.created_at)}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="progress-empty">暂无推进记录</div>
					{/if}

					{#if expandedAlerts.has(alert.id)}
						<div class="expanded-section">
							<div class="expanded-item">
								<span class="expanded-label">关联类型:</span>
								<span class="expanded-value">
									{#if alert.related_type === 'consult'}
										咨询工单
									{:else if alert.related_type === 'policy'}
										政策资料
									{:else if alert.related_type === 'draft'}
										申报底稿
									{:else}
										-
									{/if}
								</span>
							</div>
							<div class="expanded-item">
								<span class="expanded-label">关联编号:</span>
								<span class="expanded-value">{alert.related_id || '-'}</span>
							</div>
							<div class="expanded-item">
								<span class="expanded-label">创建人:</span>
								<span class="expanded-value">{alert.creator_name || '-'}</span>
							</div>
							<div class="expanded-item">
								<span class="expanded-label">创建时间:</span>
								<span class="expanded-value">{formatDate(alert.created_at)}</span>
							</div>
							{#if alert.reject_reason}
								<div class="expanded-item highlight-reject">
									<span class="expanded-label">退回原因:</span>
									<span class="expanded-value">{alert.reject_reason}</span>
								</div>
							{/if}
							{#if alert.supplement_note}
								<div class="expanded-item highlight-supplement">
									<span class="expanded-label">补充备注:</span>
									<span class="expanded-value">{alert.supplement_note}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="pagination">
			<span class="page-info">共 {total} 条记录</span>
			{#if page > 1}
				<button class="btn btn-secondary btn-sm" on:click={() => { page -= 1; loadRiskAlerts(); }}>上一页</button>
			{/if}
			<span class="page-number">第 {page} 页</span>
			{#if page * 10 < total}
				<button class="btn btn-secondary btn-sm" on:click={() => { page += 1; loadRiskAlerts(); }}>下一页</button>
			{/if}
		</div>
	{:else}
		<div class="empty-state">暂无风险提示记录</div>
	{/if}

	{#if showQuickProcessModal}
		<div class="modal-overlay" on:click={() => showQuickProcessModal = false}>
			<div class="modal" on:click|stopPropagation>
				<h3>快捷处理</h3>
				<div class="form-group">
					<label class="label">处理动作</label>
					<select class="input" bind:value={quickProcessAction}>
						<option value="">请选择</option>
						<option value="开始处理">开始处理</option>
						<option value="提出方案">提出方案</option>
						<option value="组织讨论">组织讨论</option>
						<option value="提供数据">提供数据</option>
						<option value="确定方案">确定方案</option>
						<option value="完成处理">完成处理</option>
						<option value="确认完成">确认完成</option>
						<option value="退回补充">退回补充</option>
					</select>
				</div>
				<div class="form-group">
					<label class="label">处理说明</label>
					<textarea class="input textarea" bind:value={quickProcessDescription} placeholder="请简要描述处理内容..."></textarea>
				</div>
				<div class="modal-actions">
					<button class="btn btn-secondary" on:click={() => showQuickProcessModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleQuickProcess}>提交</button>
				</div>
			</div>
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

	.filters {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		margin-bottom: 1.5rem;
		background: var(--card-bg);
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.filter-group {
		flex: 1;
	}

	.filter-actions {
		flex: 0 0 auto;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.alert-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.alert-card {
		background: var(--card-bg);
		border-radius: 0.5rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s;
	}

	.alert-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-right {
		display: flex;
		gap: 0.5rem;
	}

	.code-link {
		color: var(--primary-color);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.code-link:hover {
		text-decoration: underline;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.card-meta {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1rem;
		font-size: 0.85rem;
	}

	.meta-item {
		display: flex;
		gap: 0.25rem;
	}

	.meta-label {
		color: var(--text-secondary);
	}

	.meta-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.meta-value.time {
		color: var(--text-secondary);
		font-weight: 400;
	}

	.progress-section {
		background: #f9fafb;
		border-radius: 0.375rem;
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.progress-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.progress-count {
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: white;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.progress-timeline {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.timeline-item {
		display: flex;
		gap: 0.5rem;
		position: relative;
		padding-left: 1rem;
	}

	.timeline-item.latest {
		background: white;
		border-radius: 0.25rem;
		padding: 0.5rem 0.5rem 0.5rem 1.5rem;
		margin-left: -0.5rem;
		border-left: 3px solid var(--primary-color);
	}

	.timeline-marker {
		position: absolute;
		left: 0;
		top: 0.25rem;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-secondary);
	}

	.timeline-item.latest .timeline-marker {
		background: var(--primary-color);
		width: 10px;
		height: 10px;
		left: -0.5rem;
	}

	.timeline-content {
		flex: 1;
	}

	.timeline-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.timeline-action {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.timeline-user {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.125rem 0.375rem;
		background: #e5e7eb;
		border-radius: 0.25rem;
	}

	.timeline-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
		line-height: 1.4;
	}

	.timeline-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.progress-empty {
		text-align: center;
		padding: 0.75rem;
		color: var(--text-secondary);
		font-size: 0.85rem;
		background: #f9fafb;
		border-radius: 0.375rem;
		margin-top: 0.5rem;
	}

	.expanded-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.expanded-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.expanded-label {
		color: var(--text-secondary);
		min-width: 80px;
	}

	.expanded-value {
		color: var(--text-primary);
	}

	.highlight-reject {
		background: #fee2e2;
		padding: 0.5rem;
		border-radius: 0.25rem;
		margin-top: 0.25rem;
	}

	.highlight-reject .expanded-value {
		color: #991b1b;
	}

	.highlight-supplement {
		background: #dbeafe;
		padding: 0.5rem;
		border-radius: 0.25rem;
		margin-top: 0.25rem;
	}

	.highlight-supplement .expanded-value {
		color: #1e40af;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background: var(--card-bg);
		border-radius: 0.5rem;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.textarea {
		min-height: 100px;
		resize: vertical;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.page-info {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.page-number {
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}

	a {
		text-decoration: none;
	}
</style>