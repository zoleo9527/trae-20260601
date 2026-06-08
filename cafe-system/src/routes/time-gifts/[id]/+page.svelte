<script lang="ts">
	let { data, form } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '复核不通过', cancelled: '已取消'
	};
	const sourceLabels: Record<string, string> = {
		manual: '手动', tournament: '赛事', promotion: '活动', recharge_bonus: '充值赠送'
	};
	const tournamentStatusLabels: Record<string, string> = {
		upcoming: '未开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消'
	};
	const rechargeStatusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消'
	};
	const paymentLabels: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}

	let rejectNote = $state('');
	let showRejectForm = $state(false);

	let canCancel = $derived(
		data.timeGift.status === 'pending' &&
		(data.timeGift.operator_id === data.user.id || data.user.role === 'admin')
	);
	let canReview = $derived(
		data.timeGift.status === 'pending' && data.user.role === 'admin'
	);
	let canResubmit = $derived(
		data.timeGift.status === 'rejected' &&
		(data.timeGift.operator_id === data.user.id || data.user.role === 'operator' || data.user.role === 'tournament')
	);
</script>

<svelte:head>
	<title>赠送详情 #{data.timeGift.id} - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>时长赠送详情 #{data.timeGift.id}</h2>
		<p class="subtitle">
			<span class="status-badge status-{data.timeGift.status}">{statusLabels[data.timeGift.status]}</span>
		</p>
	</div>
	<a href="/time-gifts" class="btn">返回赠送列表</a>
</div>

<div class="detail-grid">
	<div>
		<div class="card" style="margin-bottom:20px;">
			<div class="card-header">赠送信息</div>
			<div class="card-body">
				<dl class="detail-info">
					<dt>会员</dt>
					<dd><a href="/members/{data.timeGift.member_id}">{data.timeGift.member_name}</a> ({data.timeGift.member_phone || '无手机号'})</dd>

					<dt>赠送时长</dt>
					<dd style="font-size:18px;color:var(--c-success);font-weight:700;">{data.timeGift.minutes} 分钟</dd>

					<dt>赠送原因</dt>
					<dd>{data.timeGift.reason}</dd>

					<dt>来源</dt>
					<dd>{sourceLabels[data.timeGift.source_type] || data.timeGift.source_type}</dd>

					{#if data.linkedTournament}
						<dt>关联赛事</dt>
						<dd>
							<a href="/tournaments/{data.linkedTournament.id}">{data.linkedTournament.name}</a> ({data.linkedTournament.game})
							<span class="status-badge status-{data.linkedTournament.status}" style="margin-left:6px;">
								{tournamentStatusLabels[data.linkedTournament.status] || data.linkedTournament.status}
							</span>
						</dd>
					{/if}

					{#if data.linkedRecharge}
						<dt>关联充值</dt>
						<dd>
							<a href="/recharges/{data.linkedRecharge.id}">充值单 #{data.linkedRecharge.id}</a>
							<span class="status-badge status-{data.linkedRecharge.status}" style="margin-left:6px;">
								{rechargeStatusLabels[data.linkedRecharge.status] || data.linkedRecharge.status}
							</span>
						</dd>

						<dt>充值金额</dt>
						<dd>¥{data.linkedRecharge.amount.toFixed(2)} ({paymentLabels[data.linkedRecharge.payment_method] || data.linkedRecharge.payment_method})</dd>

						<dt>赠送时长</dt>
						<dd>{data.linkedRecharge.bonus_minutes} 分钟</dd>

						<dt>充值状态</dt>
						<dd>{rechargeStatusLabels[data.linkedRecharge.status] || data.linkedRecharge.status}</dd>
					{/if}

					<dt>提交人</dt>
					<dd>{data.timeGift.operator_name}</dd>

					<dt>提交时间</dt>
					<dd>{formatTime(data.timeGift.created_at)}</dd>

					{#if data.timeGift.reviewer_name}
						<dt>审核人</dt>
						<dd>{data.timeGift.reviewer_name}</dd>

						<dt>审核时间</dt>
						<dd>{formatTime(data.timeGift.reviewed_at)}</dd>
					{/if}

					{#if data.timeGift.review_note}
						<dt>审核备注</dt>
						<dd style="color:var(--c-danger);">{data.timeGift.review_note}</dd>
					{/if}

					<dt>会员当前状态</dt>
					<dd>余额 ¥{data.timeGift.member_balance.toFixed(2)} / 赠送时长 {data.timeGift.member_bonus}分钟</dd>
				</dl>
			</div>
		</div>

		{#if canReview}
			<div class="card">
				<div class="card-header">复核操作</div>
				<div class="card-body">
					{#if form?.error}
						<div class="alert alert-danger">{form.error}</div>
					{/if}

					{#if data.timeGift.source_type === 'tournament'}
						<div style="margin-bottom:16px;padding:12px 16px;background:var(--c-warning-light);border-radius:var(--radius);font-size:13px;">
							<strong>赛事赠送注意：</strong>请确认赛事是否已结束、获奖者是否已确认，再进行复核。
							{#if data.linkedTournament && data.linkedTournament.status !== 'completed'}
								<br /><strong style="color:var(--c-danger);">当前赛事状态为"{tournamentStatusLabels[data.linkedTournament.status]}"，尚未结束，请谨慎审核。</strong>
							{/if}
						</div>
					{:else}
						<div style="margin-bottom:16px;padding:12px 16px;background:var(--c-warning-light);border-radius:var(--radius);font-size:13px;">
							<strong>复核责任：</strong>通过后系统将自动增加会员赠送时长。请确认赠送原因和时长无误后再复核。
						</div>
					{/if}

					<div class="review-section">
						<form method="POST" action="?/approve" style="display:inline;">
							<button type="submit" class="btn btn-success">复核通过</button>
						</form>
						<button class="btn btn-danger" onclick={() => showRejectForm = !showRejectForm}>
							{showRejectForm ? '取消' : '复核不通过'}
						</button>
					</div>

					{#if showRejectForm}
						<form method="POST" action="?/reject" style="margin-top:16px;">
							<div class="form-group">
								<label for="review_note">不通过原因（必填）</label>
								<textarea id="review_note" name="review_note" bind:value={rejectNote} placeholder="请说明复核不通过的原因，该原因将记录到操作时间线并通知提交人" required></textarea>
							</div>
							<button type="submit" class="btn btn-danger">确认复核不通过</button>
						</form>
					{/if}
				</div>
			</div>
		{/if}

		{#if canCancel}
			<div class="card" style="margin-top:20px;">
				<div class="card-body" style="display:flex;align-items:center;gap:16px;">
					<span style="color:var(--c-text-2);font-size:13px;">该赠送单仍在待审核状态</span>
					<form method="POST" action="?/cancel">
						<button type="submit" class="btn btn-sm" style="color:var(--c-danger);border-color:var(--c-danger);">取消赠送</button>
					</form>
				</div>
			</div>
		{/if}

		{#if canResubmit}
			<div class="card" style="margin-top:20px;">
				<div class="card-header" style="color:var(--c-danger);">复核不通过通知</div>
				<div class="card-body">
					{#if data.timeGift.review_note}
						<div class="alert alert-danger" style="margin-bottom:16px;">
							<strong>不通过原因：</strong>{data.timeGift.review_note}
						</div>
					{/if}
					{#if data.timeGift.source_type === 'tournament' && data.linkedTournament && data.linkedTournament.status !== 'completed'}
						<div class="alert alert-warning" style="margin-bottom:16px;">
							<strong>提示：</strong>关联赛事"{data.linkedTournament.name}"尚未结束，建议等待赛事完成后再重新提交。
						</div>
					{/if}
					<p style="font-size:13px;color:var(--c-text-2);margin-bottom:16px;">
						该时长赠送已被复核不通过。请根据不通过原因核实信息后，重新提交赠送申请。
					</p>
					<a href="/time-gifts/new" class="btn btn-primary">重新提交赠送</a>
				</div>
			</div>
		{/if}
	</div>

	<div>
		<div class="card">
			<div class="card-header">操作时间线</div>
			<div class="card-body">
				<div class="timeline">
					{#each data.logs as log}
						<div class="timeline-item {(log as any).action}">
							<div class="tl-time">{formatTime((log as any).created_at)}</div>
							<div class="tl-action">
								{(log as any).operator_name} —
								{#if (log as any).action === 'create'}提交赠送
								{:else if (log as any).action === 'approve'}复核通过
								{:else if (log as any).action === 'reject'}复核不通过
								{:else if (log as any).action === 'cancel'}取消赠送
								{:else}{(log as any).action}{/if}
							</div>
							<div class="tl-detail">{(log as any).detail}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		{#if data.memberGiftHistory && data.memberGiftHistory.length > 0}
			<div class="card" style="margin-top:20px;">
				<div class="card-header">时长赠送回看</div>
				<div class="card-body">
					<table class="table">
						<thead>
							<tr>
								<th>时间</th>
								<th>时长</th>
								<th>原因</th>
								<th>来源</th>
								<th>提交人</th>
								<th>状态</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each data.memberGiftHistory as g}
								<tr>
									<td>{formatTime(g.created_at)}</td>
									<td>{g.minutes} 分钟</td>
									<td>{g.reason}</td>
									<td>{sourceLabels[g.source_type] || g.source_type}</td>
									<td>{g.operator_name}</td>
									<td><span class="status-badge status-{g.status}">{statusLabels[g.status] || g.status}</span></td>
									<td><a href="/time-gifts/{g.id}">查看</a></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
