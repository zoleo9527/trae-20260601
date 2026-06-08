<script lang="ts">
	let { data } = $props();
	let showModal = $state(false);

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>上机记录 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>上机记录</h2>
		<p class="subtitle">共 {data.sessions.length} 条记录</p>
	</div>
	{#if data.user.role === 'operator'}
		<button class="btn btn-primary" onclick={() => (showModal = true)}>新建上机</button>
	{/if}
</div>

{#if showModal}
	<div class="modal-overlay" onclick={() => (showModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>新建上机</h3>
				<button class="modal-close" onclick={() => (showModal = false)}>&times;</button>
			</div>
			<form method="POST" action="?/create">
				<div class="modal-body">
					<div class="form-group">
						<label>会员</label>
						<select name="member_id" required>
							<option value="">请选择会员</option>
							{#each data.members as m}
								<option value={(m as any).id}>{(m as any).name}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>机位</label>
						<select name="computer_id" required>
							<option value="">请选择机位</option>
							{#each data.availableComputers as c}
								<option value={(c as any)}>{(c as any)}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn" onclick={() => (showModal = false)}>取消</button>
					<button type="submit" class="btn btn-primary">确认上机</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="card">
	<div class="card-body" style="padding:0;">
		{#if data.sessions.length === 0}
			<div class="empty-state">
				<div class="icon">🖥️</div>
				<p>暂无上机记录</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>会员</th>
						<th>机位</th>
						<th>开始时间</th>
						<th>结束时间</th>
						<th>时长</th>
						<th>登记人</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.sessions as s ((s as any).id)}
						<tr>
							<td>{(s as any).id}</td>
							<td><a href="/members/{(s as any).member_id}" style="font-weight:500;">{(s as any).member_name}</a></td>
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
							<td>
								{#if !(s as any).end_time && data.user.role === 'operator'}
									<form method="POST" action="?/end">
										<input type="hidden" name="id" value={(s as any).id} />
										<button type="submit" class="btn btn-sm btn-danger">结束</button>
									</form>
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
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--c-surface);
		border-radius: 8px;
		width: 440px;
		max-width: 90vw;
		box-shadow: var(--shadow-lg);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--c-border);
	}

	.modal-header h3 {
		font-size: 16px;
		font-weight: 600;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 20px;
		cursor: pointer;
		color: var(--c-text-2);
		padding: 4px 8px;
		border-radius: 4px;
	}

	.modal-close:hover {
		background: var(--c-bg);
		color: var(--c-text);
	}

	.modal-body {
		padding: 20px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 12px 20px;
		border-top: 1px solid var(--c-border);
	}
</style>
