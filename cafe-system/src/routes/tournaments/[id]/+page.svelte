<script lang="ts">
	let { data } = $props();

	let canManage = $derived(data.user && ['tournament', 'admin'].includes(data.user.role));

	const statusLabels: Record<string, string> = {
		upcoming: '未开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消',
		registered: '已报名', checked_in: '已签到', eliminated: '已淘汰', won: '冠军'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>{data.tournament.name} - 赛事详情</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>{data.tournament.name}</h2>
		<p class="subtitle">{data.tournament.game} — <span class="status-badge status-{data.tournament.status}">{statusLabels[data.tournament.status]}</span></p>
	</div>
	<a href="/tournaments" class="btn">返回赛事列表</a>
</div>

<div class="detail-grid">
	<div>
		<div class="card">
			<div class="card-header">赛事信息</div>
			<div class="card-body">
				<dl class="detail-info">
					<dt>游戏</dt>
					<dd>{data.tournament.game}</dd>
					<dt>开始时间</dt>
					<dd>{formatTime(data.tournament.start_time)}</dd>
					<dt>最大参赛人数</dt>
					<dd>{data.tournament.max_participants}</dd>
					<dt>冠军奖励时长</dt>
					<dd>{data.tournament.prize_minutes}分钟</dd>
					<dt>负责人</dt>
					<dd>{data.tournament.operator_name}</dd>
				</dl>

				{#if canManage}
					<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--c-border);">
						<form method="POST" action="?/update_status" style="display:flex;gap:8px;flex-wrap:wrap;">
							{#if data.tournament.status === 'upcoming'}
								<input type="hidden" name="new_status" value="ongoing" />
								<button type="submit" class="btn">开始赛事</button>
							{:else if data.tournament.status === 'ongoing'}
								<input type="hidden" name="new_status" value="completed" />
								<button type="submit" class="btn">结束赛事</button>
							{/if}
						</form>
						{#if data.tournament.status === 'upcoming' || data.tournament.status === 'ongoing'}
							<form method="POST" action="?/update_status" style="margin-top:8px;">
								<input type="hidden" name="new_status" value="cancelled" />
								<button type="submit" class="btn btn-sm" style="background:var(--c-danger);color:#fff;">取消赛事</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div>
		<div class="card">
			<div class="card-header">参赛人员 ({data.registrations.length}/{data.tournament.max_participants})</div>
			<div class="card-body">
				{#if canManage && (data.tournament.status === 'upcoming' || data.tournament.status === 'ongoing')}
					<form method="POST" action="?/register" style="display:flex;gap:8px;margin-bottom:12px;">
						<select name="member_id" class="form-input" style="flex:1;" required>
							<option value="">选择会员报名</option>
							{#each data.members as m}
								<option value={(m as any).id}>{(m as any).name}</option>
							{/each}
						</select>
						<button type="submit" class="btn btn-sm">报名</button>
					</form>
				{/if}

				{#if data.registrations.length === 0}
					<div class="empty-state"><p>暂无报名</p></div>
				{:else}
					<table>
						<thead>
							<tr><th>会员</th><th>状态</th><th>报名时间</th><th></th></tr>
						</thead>
						<tbody>
							{#each data.registrations as reg}
								<tr>
									<td>
										<a href="/members/{(reg as any).member_id}" style="font-weight:500;">{(reg as any).member_name}</a>
										{#if (reg as any).status === 'won'}🏆{/if}
									</td>
									<td><span class="status-badge status-{(reg as any).status}">{statusLabels[(reg as any).status]}</span></td>
									<td style="font-size:12px;color:var(--c-text-2);">{formatTime((reg as any).registered_at)}</td>
									<td>
										{#if canManage}
											{#if (reg as any).status === 'registered'}
												<form method="POST" action="?/checkin" style="display:inline;">
													<input type="hidden" name="reg_id" value={(reg as any).id} />
													<button type="submit" class="btn btn-sm">签到</button>
												</form>
											{:else if (reg as any).status === 'checked_in'}
												<form method="POST" action="?/eliminate" style="display:inline;">
													<input type="hidden" name="reg_id" value={(reg as any).id} />
													<button type="submit" class="btn btn-sm" style="background:var(--c-warning);color:#fff;">淘汰</button>
												</form>
												<form method="POST" action="?/win" style="display:inline;margin-left:4px;">
													<input type="hidden" name="reg_id" value={(reg as any).id} />
													<button type="submit" class="btn btn-sm" style="background:var(--c-success);color:#fff;">冠军</button>
												</form>
											{/if}
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
</div>
