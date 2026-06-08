<script lang="ts">
	let { data } = $props();

	let selectedMember = $state('');
	let amount = $state('');
	let bonusMinutes = $state('0');
	let paymentMethod = $state('cash');

	let selectedMemberData = $derived((data.members || []).find((m: any) => m.id === Number(selectedMember)));

	function formatBalance(b: number) {
		return '¥' + b.toFixed(2);
	}
</script>

<svelte:head>
	<title>新建充值 - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>新建会员充值</h2>
		<p class="subtitle">充值需经店长审核通过后生效</p>
	</div>
	<a href="/recharges" class="btn">返回充值列表</a>
</div>

<div class="card">
	<div class="card-body">
		<form method="POST" action="/recharges/new">
			<div class="form-group">
				<label for="member_id">选择会员</label>
				<select id="member_id" name="member_id" bind:value={selectedMember} required>
					<option value="">-- 请选择会员 --</option>
					{#each (data.members || []) as member}
						<option value={(member as any).id}>{(member as any).name} ({(member as any).phone || '无手机号'}) — 余额 {formatBalance((member as any).balance)} / 赠送 {(member as any).bonus_minutes}分钟</option>
					{/each}
				</select>
			</div>

			{#if selectedMemberData}
				<div style="padding:12px 16px;background:var(--c-primary-light);border-radius:var(--radius);margin-bottom:18px;">
					<strong>{(selectedMemberData as any).name}</strong> — 当前余额 {formatBalance((selectedMemberData as any).balance)}，赠送时长 {(selectedMemberData as any).bonus_minutes}分钟
				</div>
			{/if}

			<div class="form-row">
				<div class="form-group">
					<label for="amount">充值金额（元）</label>
					<input id="amount" name="amount" type="number" step="0.01" min="1" bind:value={amount} required placeholder="请输入充值金额" />
				</div>
				<div class="form-group">
					<label for="bonus_minutes">赠送时长（分钟）</label>
					<input id="bonus_minutes" name="bonus_minutes" type="number" min="0" bind:value={bonusMinutes} required placeholder="0" />
				</div>
			</div>

			<div class="form-group">
				<label for="payment_method">支付方式</label>
				<select id="payment_method" name="payment_method" bind:value={paymentMethod}>
					<option value="cash">现金</option>
					<option value="wechat">微信</option>
					<option value="alipay">支付宝</option>
				</select>
			</div>

			{#if Number(bonusMinutes) > 0}
			<div style="padding:12px 16px;background:var(--c-success-light);border-radius:var(--radius);margin-bottom:18px;font-size:13px;">
				<strong>赠送时长说明：</strong>系统将自动创建一条关联的「时长赠送」记录（来源：充值赠送），与充值单分别审核。充值通过后余额到账，赠送时长需店长复核通过后生效，责任归属清晰可追溯。
			</div>
		{:else}
			<div style="padding:12px 16px;background:var(--c-warning-light);border-radius:var(--radius);margin-bottom:18px;font-size:13px;">
				<strong>提示：</strong>充值提交后将进入"待审核"状态，需店长审核通过后余额才会到账。如需赠送时长，请填写赠送时长字段。
			</div>
		{/if}

			<button type="submit" class="btn btn-primary">提交充值（待审核）</button>
		</form>
	</div>
</div>
