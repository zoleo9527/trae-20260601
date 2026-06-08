<script lang="ts">
	let { data } = $props();

	let showForm = $state(false);

	let canCreate = $derived(data.user && ['tournament', 'admin'].includes(data.user.role));

	const statusLabels: Record<string, string> = {
		upcoming: '未开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>赛事管理 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>赛事管理</h2>
		<p class="subtitle">共 {data.tournaments.length} 项赛事</p>
	</div>
	{#if canCreate}
		<button class="btn" onclick={() => showForm = !showForm}>
			{showForm ? '取消' : '创建赛事'}
		</button>
	{/if}
</div>

{#if showForm}
	<div class="card" style="margin-bottom:16px;">
		<div class="card-header">创建新赛事</div>
		<div class="card-body">
			<form method="POST" action="?/create">
				<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
					<div class="form-group">
						<label class="form-label">赛事名称</label>
						<input type="text" name="name" class="form-input" required />
					</div>
					<div class="form-group">
						<label class="form-label">游戏</label>
						<input type="text" name="game" class="form-input" required />
					</div>
					<div class="form-group">
						<label class="form-label">开始时间</label>
						<input type="datetime-local" name="start_time" class="form-input" required />
					</div>
					<div class="form-group">
						<label class="form-label">最大参赛人数</label>
						<input type="number" name="max_participants" class="form-input" value="32" min="2" />
					</div>
					<div class="form-group">
						<label class="form-label">冠军奖励时长（分钟）</label>
						<input type="number" name="prize_minutes" class="form-input" value="60" min="0" />
					</div>
				</div>
				<div style="margin-top:16px;">
					<button type="submit" class="btn">创建赛事</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="card">
	<div class="card-body" style="padding:0;">
		{#if data.tournaments.length === 0}
			<div class="empty-state">
				<div class="icon">🏆</div>
				<p>暂无赛事</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>赛事名称</th>
						<th>游戏</th>
						<th>开始时间</th>
						<th>状态</th>
						<th>参赛人数</th>
						<th>奖励时长</th>
						<th>负责人</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.tournaments as t ((t as any).id)}
						<tr>
							<td>{(t as any).id}</td>
							<td style="font-weight:500;">{(t as any).name}</td>
							<td>{(t as any).game}</td>
							<td style="font-size:12px;">{formatTime((t as any).start_time)}</td>
							<td><span class="status-badge status-{(t as any).status}">{statusLabels[(t as any).status]}</span></td>
							<td>{(t as any).participant_count}/{(t as any).max_participants}</td>
							<td>{(t as any).prize_minutes}分钟</td>
							<td>{(t as any).operator_name}</td>
							<td><a href="/tournaments/{(t as any).id}" class="btn btn-sm">详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
