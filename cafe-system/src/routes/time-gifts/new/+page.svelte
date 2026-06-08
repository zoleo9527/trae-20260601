<script lang="ts">
	let { data } = $props();

	let selectedMember = $state('');
	let minutes = $state('');
	let reason = $state('');
	let sourceType = $state(data.user?.role === 'tournament' ? 'tournament' : 'manual');
	let sourceId = $state('');

	let selectedMemberData = $derived((data.members || []).find((m: any) => m.id === Number(selectedMember)));
</script>

<svelte:head>
	<title>新建时长赠送 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>新建时长赠送</h2>
		<p class="subtitle">赠送需经店长复核通过后生效</p>
	</div>
	<a href="/time-gifts" class="btn">返回赠送列表</a>
</div>

<div class="card">
	<div class="card-body">
		{#if (data as any).form?.error}
			<div class="alert alert-danger">{(data as any).form.error}</div>
		{/if}

		<form method="POST">
			<div class="form-group">
				<label for="member_id">选择会员</label>
				<select id="member_id" name="member_id" bind:value={selectedMember} required>
					<option value="">-- 请选择会员 --</option>
					{#each (data.members || []) as member}
						<option value={(member as any).id}>{(member as any).name} ({(member as any).phone || '无手机号'}) — 赠送时长 {(member as any).bonus_minutes}分钟</option>
					{/each}
				</select>
			</div>

			{#if selectedMemberData}
				<div style="padding:12px 16px;background:var(--c-primary-light);border-radius:var(--radius);margin-bottom:18px;">
					<strong>{(selectedMemberData as any).name}</strong> — 当前赠送时长 {(selectedMemberData as any).bonus_minutes}分钟
				</div>
			{/if}

			<div class="form-row">
				<div class="form-group">
					<label for="minutes">赠送时长（分钟）</label>
					<input id="minutes" name="minutes" type="number" min="1" bind:value={minutes} required placeholder="请输入赠送时长" />
				</div>
				<div class="form-group">
					<label for="source_type">赠送来源</label>
					<select id="source_type" name="source_type" bind:value={sourceType}>
						<option value="manual">手动赠送</option>
						{#if data.user?.role === 'tournament' || data.user?.role === 'admin'}
							<option value="tournament">赛事奖励</option>
						{/if}
						<option value="promotion">活动赠送</option>
					</select>
				</div>
			</div>

			{#if sourceType === 'tournament' && (data.tournaments || []).length > 0}
				<div class="form-group">
					<label for="source_id">关联赛事</label>
					<select id="source_id" name="source_id" bind:value={sourceId}>
						<option value="">-- 可选，关联到具体赛事 --</option>
						{#each (data.tournaments || []) as t}
							<option value={(t as any).id}>{(t as any).name} ({(t as any).game}) - {(t as any).status === 'upcoming' ? '未开始' : (t as any).status === 'ongoing' ? '进行中' : '已结束'}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="form-group">
				<label for="reason">赠送原因</label>
				<textarea id="reason" name="reason" bind:value={reason} required placeholder="请详细说明赠送原因，例如：赛事冠军奖励、设备故障补偿等"></textarea>
			</div>

			<div style="padding:12px 16px;background:var(--c-warning-light);border-radius:var(--radius);margin-bottom:18px;font-size:13px;">
				<strong>责任说明：</strong>时长赠送提交后将进入"待审核"状态。赠送原因和来源将记录在案，店长复核通过后时长才会生效。复核不通过时，提交人将收到退回原因。
			</div>

			<button type="submit" class="btn btn-primary">提交赠送（待审核）</button>
		</form>
	</div>
</div>
