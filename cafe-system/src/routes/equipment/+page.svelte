<script lang="ts">
	let { data } = $props();

	let showCreate = $state(false);
	let assignTarget = $state<number | null>(null);
	let resolveTarget = $state<number | null>(null);

	const statusLabels: Record<string, string> = {
		reported: '已报修', in_progress: '维修中', resolved: '已修复', wont_fix: '不修'
	};

	let isAdmin = $derived(data.user?.role === 'admin');

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>设备维修 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>设备维修</h2>
		<p class="subtitle">共 {data.repairs.length} 条记录</p>
	</div>
	<button class="btn btn-primary" onclick={() => showCreate = !showCreate}>报修</button>
</div>

{#if showCreate}
	<div class="card" style="margin-bottom:16px;">
		<div class="card-body">
			<form method="POST" action="?/create">
				<div class="form-group">
					<label class="form-label">机位号</label>
					<input type="text" name="computer_id" class="form-input" placeholder="如 A-01" required />
				</div>
				<div class="form-group">
					<label class="form-label">故障描述</label>
					<textarea name="issue" class="form-input" rows="3" placeholder="描述故障情况" required></textarea>
				</div>
				<div style="display:flex;gap:8px;">
					<button type="submit" class="btn btn-primary">提交报修</button>
					<button type="button" class="btn" onclick={() => showCreate = false}>取消</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="card">
	<div class="card-body" style="padding:0;">
		{#if data.repairs.length === 0}
			<div class="empty-state">
				<div class="icon">🔧</div>
				<p>暂无维修记录</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>机位</th>
						<th>故障描述</th>
						<th>报修人</th>
						<th>指派给</th>
						<th>状态</th>
						<th>报修时间</th>
						<th>修复时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each data.repairs as r ((r as any).id)}
						<tr>
							<td>{(r as any).id}</td>
							<td style="font-weight:500;">{(r as any).computer_id}</td>
							<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title={(r as any).issue}>{(r as any).issue}</td>
							<td>{(r as any).reporter_name}</td>
							<td>{(r as any).assignee_name || '-'}</td>
							<td><span class="status-badge status-{(r as any).status}">{statusLabels[(r as any).status]}</span></td>
							<td style="font-size:12px;color:var(--c-text-2);">{formatTime((r as any).created_at)}</td>
							<td style="font-size:12px;color:var(--c-text-2);">{(r as any).resolved_at ? formatTime((r as any).resolved_at) : '-'}</td>
							<td>
								{#if (r as any).status === 'reported' && isAdmin}
									<button class="btn btn-sm" onclick={() => assignTarget = assignTarget === (r as any).id ? null : (r as any).id}>指派</button>
								{/if}
								{#if (r as any).status === 'in_progress' && (isAdmin || (r as any).assigned_to === data.user?.id)}
									<button class="btn btn-sm" onclick={() => resolveTarget = resolveTarget === (r as any).id ? null : (r as any).id}>修复</button>
								{/if}
							</td>
						</tr>
						{#if assignTarget === (r as any).id}
							<tr>
								<td colspan="9" style="padding:12px 16px;background:var(--c-bg-2);">
									<form method="POST" action="?/assign" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
										<input type="hidden" name="id" value={(r as any).id} />
										<label class="form-label" style="margin:0;">指派给</label>
										<select name="assigned_to" class="form-input" style="width:auto;" required>
											<option value="">选择维修人员</option>
											{#each data.operators as op}
												<option value={(op as any).id}>{(op as any).display_name}</option>
											{/each}
										</select>
										<button type="submit" class="btn btn-primary btn-sm">确认指派</button>
										<button type="button" class="btn btn-sm" onclick={() => assignTarget = null}>取消</button>
									</form>
								</td>
							</tr>
						{/if}
						{#if resolveTarget === (r as any).id}
							<tr>
								<td colspan="9" style="padding:12px 16px;background:var(--c-bg-2);">
									<form method="POST" action="?/resolve" style="display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;">
										<input type="hidden" name="id" value={(r as any).id} />
										<label class="form-label" style="margin:0;">修复说明</label>
										<textarea name="resolution_note" class="form-input" rows="2" style="width:300px;" placeholder="描述修复情况" required></textarea>
										<button type="submit" class="btn btn-primary btn-sm">确认修复</button>
										<button type="button" class="btn btn-sm" onclick={() => resolveTarget = null}>取消</button>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
