<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let users: any[] = [];
	let loading = false;

	let form = {
		title: '',
		type: 'policy_dispute',
		severity: 'medium',
		assignee_id: '',
		related_type: 'consult',
		related_id: '',
		due_date: ''
	};

	onMount(async () => {
		try {
			const res = await fetch('/api/auth/current-user');
			const data = await res.json();
			
			const usersRes = await fetch('/api/risk-alerts');
			const alertsData = await usersRes.json();
		} catch (e) {
			console.error(e);
		}
	});

	async function submit() {
		if (!form.title || !form.assignee_id) {
			alert('请填写标题和责任人');
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/risk-alerts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});

			const data = await res.json();
			if (data.id) {
				goto(`/risk-alerts/${data.id}`);
			} else {
				alert('创建失败');
			}
		} catch (e) {
			alert('网络错误');
		}
		loading = false;
	}

	const typeOptions = [
		{ value: 'policy_dispute', label: '政策适用争议' },
		{ value: 'draft_version_chaos', label: '底稿版本混乱' },
		{ value: 'response_unsigned', label: '答复未签收' },
		{ value: 'missing_docs', label: '补充资料缺失' },
		{ value: 'deadline_risk', label: '申报期限风险' },
		{ value: 'system_error', label: '系统操作异常' }
	];

	const severityOptions = [
		{ value: 'high', label: '高风险' },
		{ value: 'medium', label: '中风险' },
		{ value: 'low', label: '低风险' }
	];

	const relatedTypeOptions = [
		{ value: 'consult', label: '咨询工单' },
		{ value: 'policy', label: '政策资料' },
		{ value: 'draft', label: '申报底稿' }
	];

	const assigneeOptions = [
		{ value: '1', label: '张税务（税务顾问）' },
		{ value: '2', label: '李经理（项目经理）' },
		{ value: '3', label: '王财务（客户财务）' }
	];
</script>

<div class="container">
	<h1>新建风险提示</h1>

	<div class="form-card">
		<form on:submit|preventDefault={submit}>
			<div class="form-group">
				<label class="label" for="title">风险标题 *</label>
				<input
					id="title"
					class="input"
					type="text"
					placeholder="例如：股权激励个税计算政策适用争议"
					bind:value={form.title}
					disabled={loading}
				/>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="label" for="type">风险类型 *</label>
					<select id="type" class="input" bind:value={form.type} disabled={loading}>
						{#each typeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="label" for="severity">紧急度 *</label>
					<select id="severity" class="input" bind:value={form.severity} disabled={loading}>
						{#each severityOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="label" for="related_type">关联类型</label>
					<select id="related_type" class="input" bind:value={form.related_type} disabled={loading}>
						{#each relatedTypeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="label" for="related_id">关联编号</label>
					<input
						id="related_id"
						class="input"
						type="text"
						placeholder="例如：2024-个税-001"
						bind:value={form.related_id}
						disabled={loading}
					/>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="label" for="assignee_id">责任人 *</label>
					<select id="assignee_id" class="input" bind:value={form.assignee_id} disabled={loading}>
						<option value="">请选择责任人</option>
						{#each assigneeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="label" for="due_date">截止时间</label>
					<input
						id="due_date"
						class="input"
						type="datetime-local"
						bind:value={form.due_date}
						disabled={loading}
					/>
				</div>
			</div>

			<div class="form-actions">
				<a href="/risk-alerts" class="btn btn-secondary">取消</a>
				<button class="btn btn-primary" type="submit" disabled={loading}>
					{#if loading}
						创建中...
					{:else}
						创建风险提示
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
	}

	.form-card {
		background: var(--card-bg);
		border-radius: 0.5rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		max-width: 800px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	a {
		text-decoration: none;
	}
</style>