<script lang="ts">
	let { data } = $props();

	let search = $state(data.search);

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}
</script>

<svelte:head>
	<title>会员管理 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>会员管理</h2>
		<p class="subtitle">共 {data.members.length} 位会员</p>
	</div>
</div>

<div class="card">
	<div class="card-header">
		<span>会员列表</span>
		<form method="GET" action="/members" style="display:flex;gap:8px;">
			<input type="text" name="search" bind:value={search} placeholder="搜索姓名或手机号" style="padding:5px 10px;border:1px solid var(--c-border);border-radius:var(--radius);font-size:13px;width:200px;" />
			<button type="submit" class="btn btn-sm">搜索</button>
			{#if search}
				<a href="/members" class="btn btn-sm">清除</a>
			{/if}
		</form>
	</div>
	<div class="card-body" style="padding:0;">
		{#if data.members.length === 0}
			<div class="empty-state">
				<div class="icon">👤</div>
				<p>暂无会员</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>姓名</th>
						<th>手机号</th>
						<th>余额</th>
						<th>赠送时长</th>
						<th>注册时间</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.members as member}
						<tr>
							<td>{(member as any).id}</td>
							<td style="font-weight:500;">{(member as any).name}</td>
							<td>{(member as any).phone || '-'}</td>
							<td>¥{(member as any).balance.toFixed(2)}</td>
							<td>{(member as any).bonus_minutes} 分钟</td>
							<td style="color:var(--c-text-2);font-size:12px;">{formatTime((member as any).created_at)}</td>
							<td><a href="/members/{(member as any).id}" class="btn btn-sm">详情</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
