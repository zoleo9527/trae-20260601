<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let detail: any = null;
	let loading = true;
	let processAction = '';
	let processDescription = '';
	let showProcessModal = false;
	let showFollowUpModal = false;
	let followUpNote = '';
	let followUpResult = 'pending';
	let followUpDate = '';
	let rejectReason = '';
	let supplementNote = '';
	let currentUserRole = '';
	let currentUserId = '';

	onMount(async () => {
		await loadCurrentUser();
		await loadDetail();
	});

	async function loadCurrentUser() {
		try {
			const res = await fetch('/api/auth/current-user');
			const data = await res.json();
			if (data.user) {
				currentUserRole = data.user.role;
				currentUserId = data.user.id.toString();
			}
		} catch (e) {
			console.error(e);
		}
	}

	async function loadDetail() {
		loading = true;
		try {
			const id = $page.params.id;
			const res = await fetch(`/api/risk-alerts/${id}`);
			detail = await res.json();
			
			const today = new Date();
			followUpDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		} catch (e) {
			console.error(e);
		}
		loading = false;
	}

	async function handleProcess() {
		if (!processAction) {
			alert('请选择处理动作');
			return;
		}

		if (processAction === '退回补充' && !rejectReason) {
			alert('请填写退回原因');
			return;
		}

		try {
			const id = $page.params.id;
			const payload: any = {
				action: processAction,
				description: processDescription
			};

			if (processAction === '退回补充') {
				payload.reject_reason = rejectReason;
				payload.supplement_note = supplementNote;
			}

			if (processAction === '补充资料') {
				payload.supplement_note = supplementNote;
			}

			const res = await fetch(`/api/risk-alerts/${id}/process`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const error = await res.json();
				alert(error.error || '处理失败');
				return;
			}

			showProcessModal = false;
			processAction = '';
			processDescription = '';
			rejectReason = '';
			supplementNote = '';
			await loadDetail();
		} catch (e) {
			alert('处理失败');
		}
	}

	async function handleFollowUp() {
		try {
			const id = $page.params.id;
			const res = await fetch(`/api/risk-alerts/${id}/follow-ups`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					follow_date: followUpDate,
					result: followUpResult,
					note: followUpNote
				})
			});

			if (!res.ok) {
				const error = await res.json();
				alert(error.error || '添加跟踪失败');
				return;
			}

			showFollowUpModal = false;
			followUpNote = '';
			followUpResult = 'pending';
			await loadDetail();
		} catch (e) {
			alert('添加跟踪失败');
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

	function getFollowUpResultLabel(result: string): string {
		const labels = {
			resolved: '已解决',
			pending: '待处理',
			escalated: '已升级'
		};
		return labels[result] || result;
	}

	function getTodoTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			risk_process: '风险处理',
			review_confirm: '审核确认',
			sign_receive: '签收确认',
			supplement_docs: '补充资料',
			follow_up: '后续跟踪'
		};
		return labels[type] || type;
	}

	function getAvailableActions() {
		if (!detail?.riskAlert || !detail.todos) return [];
		
		const actions: { value: string; label: string; todoType?: string }[] = [];
		const status = detail.riskAlert.status;

		for (const todo of detail.todos) {
			if (todo.status !== 'pending' && todo.status !== 'processing') continue;

			switch (todo.todo_type) {
				case 'risk_process':
					if (status === 'pending') {
						actions.push({ value: '开始处理', label: '开始处理', todoType: 'risk_process' });
					} else if (status === 'processing') {
						actions.push(
							{ value: '提出方案', label: '提出方案', todoType: 'risk_process' },
							{ value: '组织讨论', label: '组织讨论', todoType: 'risk_process' },
							{ value: '提供数据', label: '提供数据', todoType: 'risk_process' },
							{ value: '确定方案', label: '确定方案', todoType: 'risk_process' },
							{ value: '完成处理', label: '完成处理', todoType: 'risk_process' }
						);
					}
					break;
				case 'review_confirm':
					if (status === 'confirming') {
						actions.push(
							{ value: '确认完成', label: '确认完成', todoType: 'review_confirm' },
							{ value: '退回补充', label: '退回补充', todoType: 'review_confirm' }
						);
					}
					break;
				case 'supplement_docs':
					actions.push({ value: '补充资料', label: '补充资料', todoType: 'supplement_docs' });
					break;
				case 'sign_receive':
					actions.push({ value: '签收确认', label: '签收确认', todoType: 'sign_receive' });
					break;
			}
		}

		if (status === 'completed' && currentUserRole === 'project_manager') {
			const hasFollowUpTodo = detail.todos.some((t: any) => t.todo_type === 'follow_up');
			if (!hasFollowUpTodo) {
				const existingAction = actions.find(a => a.value === '重新处理');
				if (!existingAction) {
					actions.push({ value: '重新处理', label: '重新处理' });
				}
			}
		}

		return actions;
	}

	function hasTodoType(todoType: string): boolean {
		if (!detail?.todos) return false;
		return detail.todos.some((t: any) => t.todo_type === todoType && (t.status === 'pending' || t.status === 'processing'));
	}
</script>

<div class="container">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else if detail}
		<div class="header">
			<div class="header-left">
				<h1>{detail.riskAlert.title}</h1>
				<div class="meta">
					<span class="code">{detail.riskAlert.code}</span>
					<span class="badge badge-{detail.riskAlert.severity}">
						{#if detail.riskAlert.severity === 'high'}
							高风险
						{:else if detail.riskAlert.severity === 'medium'}
							中风险
						{:else}
							低风险
						{/if}
					</span>
					<span class="status-badge status-{detail.riskAlert.status}">
						{getStatusLabel(detail.riskAlert.status)}
					</span>
				</div>
			</div>
			<div class="header-right">
				{#if detail.riskAlert.status !== 'closed'}
					{#if getAvailableActions().length > 0}
						<button class="btn btn-primary" on:click={() => showProcessModal = true}>处理</button>
					{/if}
					{#if hasTodoType('follow_up')}
						<button class="btn btn-secondary" on:click={() => showFollowUpModal = true}>添加跟踪</button>
					{/if}
				{/if}
				<a href="/risk-alerts" class="btn btn-secondary">返回列表</a>
			</div>
		</div>

		<div class="grid grid-cols-2">
			<div class="card">
				<h2>基础信息</h2>
				<div class="info-list">
					<div class="info-item">
						<div class="info-label">风险类型</div>
						<div class="info-value">{getTypeLabel(detail.riskAlert.type)}</div>
					</div>
					<div class="info-item">
						<div class="info-label">关联类型</div>
						<div class="info-value">
							{#if detail.riskAlert.related_type === 'consult'}
								咨询工单
							{:else if detail.riskAlert.related_type === 'policy'}
								政策资料
							{:else if detail.riskAlert.related_type === 'draft'}
								申报底稿
							{:else}
								-
							{/if}
						</div>
					</div>
					<div class="info-item">
						<div class="info-label">关联编号</div>
						<div class="info-value">{detail.riskAlert.related_id || '-'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">责任人</div>
						<div class="info-value">{detail.assignee?.name || '-'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">创建人</div>
						<div class="info-value">{detail.creator?.name || '-'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">创建时间</div>
						<div class="info-value">{formatDate(detail.riskAlert.created_at)}</div>
					</div>
					<div class="info-item">
						<div class="info-label">截止时间</div>
						<div class="info-value">
							{#if detail.riskAlert.due_date}
								{formatDate(detail.riskAlert.due_date)}
							{:else}
								-
							{/if}
						</div>
					</div>
				</div>
			</div>

			<div class="card">
				<h2>退回原因与补充备注</h2>
				{#if detail.riskAlert.reject_reason}
					<div class="note-section">
						<div class="note-title">退回原因</div>
						<div class="note-content reject">{detail.riskAlert.reject_reason}</div>
					</div>
				{/if}
				{#if detail.riskAlert.supplement_note}
					<div class="note-section">
						<div class="note-title">补充备注</div>
						<div class="note-content supplement">{detail.riskAlert.supplement_note}</div>
					</div>
				{/if}
				{#if !detail.riskAlert.reject_reason && !detail.riskAlert.supplement_note}
					<div class="empty-note">暂无退回原因或补充备注</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<h2>我的待办</h2>
			{#if detail.todos && detail.todos.length > 0}
				<div class="todo-list">
					{#each detail.todos as todo}
						<div class="todo-item">
							<div class="todo-info">
								<span class="todo-type">{getTodoTypeLabel(todo.todo_type)}</span>
								<span class="status-badge status-{todo.status}">{todo.status === 'pending' ? '待处理' : todo.status === 'processing' ? '处理中' : '已完成'}</span>
							</div>
							<div class="todo-date">{formatDate(todo.created_at)}</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">暂无待办事项</div>
			{/if}
		</div>

		<div class="card">
			<h2>操作日志</h2>
			{#if detail.operationLogs && detail.operationLogs.length > 0}
				<div class="timeline">
					{#each detail.operationLogs as log}
						<div class="timeline-item">
							<div class="timeline-marker"></div>
							<div class="timeline-content">
								<div class="timeline-header">
									<span class="timeline-action">{log.action}</span>
									<span class="timeline-user">{log.user_name || '系统'}</span>
									<span class="timeline-time">{formatDate(log.created_at)}</span>
								</div>
								{#if log.description}
									<div class="timeline-desc">{log.description}</div>
								{/if}
								{#if log.old_value && log.new_value}
									<div class="timeline-change">
										<span class="old-value">{log.old_value}</span>
										->
										<span class="new-value">{log.new_value}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">暂无操作日志</div>
			{/if}
		</div>

		<div class="card">
			<h2>后续跟踪记录</h2>
			{#if detail.followUps && detail.followUps.length > 0}
				<table class="table">
					<thead>
						<tr>
							<th>跟踪日期</th>
							<th>结果</th>
							<th>备注</th>
							<th>记录时间</th>
						</tr>
					</thead>
					<tbody>
						{#each detail.followUps as followUp}
							<tr>
								<td>{formatDate(followUp.follow_date)}</td>
								<td>
									<span class="status-badge status-{followUp.result === 'resolved' ? 'completed' : followUp.result === 'pending' ? 'pending' : 'processing'}">
										{getFollowUpResultLabel(followUp.result)}
									</span>
								</td>
								<td>{followUp.note || '-'}</td>
								<td>{formatDate(followUp.created_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="empty-state">暂无后续跟踪记录</div>
			{/if}
		</div>

		{#if showProcessModal}
			<div class="modal-overlay" on:click={() => showProcessModal = false}>
				<div class="modal" on:click|stopPropagation>
					<h3>处理风险提示</h3>
					<div class="form-group">
						<label class="label">处理动作</label>
						<select class="input" bind:value={processAction}>
							<option value="">请选择</option>
							{#each getAvailableActions() as action}
								<option value={action.value}>{action.label} {action.todoType ? `(${getTodoTypeLabel(action.todoType)})` : ''}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="label">处理说明</label>
						<textarea class="input textarea" bind:value={processDescription} placeholder="请详细描述处理内容..."></textarea>
					</div>
					{#if processAction === '退回补充'}
						<div class="form-group">
							<label class="label">退回原因 *</label>
							<textarea class="input textarea" bind:value={rejectReason} placeholder="请说明退回原因..."></textarea>
						</div>
						<div class="form-group">
							<label class="label">补充备注</label>
							<textarea class="input textarea" bind:value={supplementNote} placeholder="请填写补充备注..."></textarea>
						</div>
					{/if}
					{#if processAction === '补充资料'}
						<div class="form-group">
							<label class="label">补充备注</label>
							<textarea class="input textarea" bind:value={supplementNote} placeholder="请填写补充资料内容..."></textarea>
						</div>
					{/if}
					<div class="modal-actions">
						<button class="btn btn-secondary" on:click={() => showProcessModal = false}>取消</button>
						<button class="btn btn-primary" on:click={handleProcess}>提交</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showFollowUpModal}
			<div class="modal-overlay" on:click={() => showFollowUpModal = false}>
				<div class="modal" on:click|stopPropagation>
					<h3>添加后续跟踪</h3>
					<div class="form-group">
						<label class="label">跟踪日期</label>
						<input type="date" class="input" bind:value={followUpDate} />
					</div>
					<div class="form-group">
						<label class="label">跟踪结果</label>
						<select class="input" bind:value={followUpResult}>
							<option value="pending">待处理</option>
							<option value="resolved">已解决</option>
							<option value="escalated">已升级</option>
						</select>
					</div>
					<div class="form-group">
						<label class="label">跟踪备注</label>
						<textarea class="input textarea" bind:value={followUpNote} placeholder="请描述跟踪情况..."></textarea>
					</div>
					<div class="modal-actions">
						<button class="btn btn-secondary" on:click={() => showFollowUpModal = false}>取消</button>
						<button class="btn btn-primary" on:click={handleFollowUp}>提交</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="error-state">加载失败</div>
	{/if}
</div>

<style>
	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.75rem 0;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	.loading, .error-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		background: var(--card-bg);
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.header-left {
		flex: 1;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.code {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.header-right {
		display: flex;
		gap: 0.75rem;
	}

	.grid-cols-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color);
	}

	.info-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		min-width: 120px;
	}

	.info-value {
		font-size: 0.875rem;
		color: var(--text-primary);
		flex: 1;
	}

	.note-section {
		margin-bottom: 1rem;
	}

	.note-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.note-content {
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.note-content.reject {
		background: #fee2e2;
		color: #991b1b;
	}

	.note-content.supplement {
		background: #dbeafe;
		color: #1e40af;
	}

	.empty-note {
		text-align: center;
		padding: 1rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.todo-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.todo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 0.375rem;
	}

	.todo-info {
		display: flex;
		gap: 0.75rem;
	}

	.todo-type {
		font-size: 0.875rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.todo-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.timeline {
		position: relative;
		padding-left: 2rem;
	}

	.timeline-item {
		position: relative;
		padding-bottom: 1.5rem;
	}

	.timeline-item:last-child {
		padding-bottom: 0;
	}

	.timeline-marker {
		position: absolute;
		left: -2rem;
		top: 0.25rem;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--primary-color);
	}

	.timeline-item::before {
		content: '';
		position: absolute;
		left: -1.45rem;
		top: 0.5rem;
		width: 2px;
		height: 100%;
		background: var(--border-color);
	}

	.timeline-item:last-child::before {
		display: none;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.timeline-action {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.timeline-user {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.125rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
	}

	.timeline-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.timeline-desc {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}

	.timeline-change {
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.old-value {
		color: #dc2626;
	}

	.new-value {
		color: #10b981;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
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
		max-height: 80vh;
		overflow-y: auto;
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

	a {
		text-decoration: none;
	}
</style>
