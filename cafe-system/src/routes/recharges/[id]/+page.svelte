<script lang="ts">
	let { data, form } = $props();

	const statusLabels: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消'
	};
	const paymentLabels: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝'
	};
	const sourceTypeLabels: Record<string, string> = {
		recharge_bonus: '充值赠送'
	};

	function formatTime(t: string) {
		if (!t) return '-';
		return t.substring(0, 16).replace('T', ' ');
	}

	let rejectNote = $state('');
	let showRejectForm = $state(false);

	let canCancel = $derived(
		data.recharge.status === 'pending' &&
		(data.recharge.operator_id === data.user.id || data.user.role === 'admin')
	);
	let canReview = $derived(
		data.recharge.status === 'pending' && data.user.role === 'admin'
	);
	let canResubmit = $derived(
		data.recharge.status === 'rejected' &&
		(data.recharge.operator_id === data.user.id || data.user.role === 'operator')
	);
</script>

<svelte:head>
	<title>充值详情 #{data.recharge.id} - 网咖电竞馆</title>
</svelte:head>

<div class="page-header">
	<div>
		<h2>充值详情 #{data.recharge.id}</h2>
		<p class="subtitle">
			<span class="status-badge status-{data.recharge.status}">{statusLabels[data.recharge.status]}</span>
		</p>
	</div>
	<a href="/recharges" class="btn">返回充值列表</a>
</div>

<div class="detail-grid">
	<div>
		<div class="card" style="margin-bottom:20px;">
			<div class="card-header">充值信息</div>
			<div class="card-body">
				<dl class="detail-info">
					<dt>会员</dt>
					<dd><a href="/members/{data.recharge.member_id}">{data.recharge.member_name}</a> ({data.recharge.member_phone || '无手机号'})</dd>

					<dt>充值金额</dt>
					<dd style="font-size:18px;color:var(--c-primary);font-weight:700;">¥{data.recharge.amount.toFixed(2)}</dd>

					<dt>赠送时长</dt>
					<dd>{data.recharge.bonus_minutes > 0 ? data.recharge.bonus_minutes + ' 分钟' : '无赠送'}</dd>

					<dt>支付方式</dt>
					<dd>{paymentLabels[data.recharge.payment_method] || data.recharge.payment_method}</dd>

					<dt>操作人</dt>
					<dd>{data.recharge.operator_name}</dd>

					<dt>提交时间</dt>
					<dd>{formatTime(data.recharge.created_at)}</dd>

					{#if data.recharge.reviewer_name}
						<dt>审核人</dt>
						<dd>{data.recharge.reviewer_name}</dd>

						<dt>审核时间</dt>
						<dd>{formatTime(data.recharge.reviewed_at)}</dd>
					{/if}

					{#if data.recharge.review_note}
						<dt>审核备注</dt>
						<dd style="color:var(--c-danger);">{data.recharge.review_note}</dd>
					{/if}

					<dt>会员当前状态</dt>
					<dd>余额 ¥{data.recharge.member_balance.toFixed(2)} / 赠送时长 {data.recharge.member_bonus}分钟</dd>
				</dl>
			</div>
		</div>

		{#if data.linkedGift}
			<div class="card" style="margin-bottom:20px;">
				<div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
					关联赠送
					<span class="status-badge status-{data.linkedGift.status}">{statusLabels[data.linkedGift.status]}</span>
				</div>
				<div class="card-body">
					<dl class="detail-info">
						<dt>赠送时长</dt>
						<dd style="font-weight:600;">{data.linkedGift.minutes} 分钟</dd>

						<dt>来源类型</dt>
						<dd>{sourceTypeLabels[data.linkedGift.source_type] || data.linkedGift.source_type}</dd>

						<dt>赠送原因</dt>
						<dd>{data.linkedGift.reason || '-'}</dd>

						{#if data.linkedGift.reviewer_name}
							<dt>审核人</dt>
							<dd>{data.linkedGift.reviewer_name}</dd>
						{/if}

						{#if data.linkedGift.review_note}
							<dt>审核备注</dt>
							<dd>{data.linkedGift.review_note}</dd>
						{/if}

						<dt>详情</dt>
						<dd><a href="/time-gifts/{data.linkedGift.id}">查看赠送记录 #{data.linkedGift.id}</a></dd>
					</dl>

					{#if data.linkedGift.status === 'pending'}
						<div class="alert" style="background:var(--c-warning-light);border:none;margin-top:12px;">
							充值审核时将同步处理
						</div>
					{:else if data.linkedGift.status === 'approved'}
						<div class="alert" style="background:var(--c-success-light);border:none;margin-top:12px;">
							已随充值通过
						</div>
					{:else if data.linkedGift.status === 'rejected'}
						<div class="alert alert-danger" style="margin-top:12px;">
							退回原因：{data.linkedGift.review_note || '无'}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if canReview}
			<div class="card">
				<div class="card-header">审核操作</div>
				<div class="card-body">
					{#if form?.error}
						<div class="alert alert-danger">{form.error}</div>
					{/if}

					<div style="margin-bottom:16px;padding:12px 16px;background:var(--c-warning-light);border-radius:var(--radius);font-size:13px;">
						<strong>审核责任：</strong>{data.recharge.bonus_minutes > 0 ? '充值审核将同步处理关联的赠送时长。' : ''}通过后系统将自动增加会员余额{data.recharge.bonus_minutes > 0 ? '和赠送时长' : ''}。请确认充值金额、赠送时长和支付方式无误后再审核。
					</div>

					<div class="review-section">
						<form method="POST" action="?/approve" style="display:inline;">
							<button type="submit" class="btn btn-success">审核通过</button>
						</form>
						<button class="btn btn-danger" onclick={() => showRejectForm = !showRejectForm}>
							{showRejectForm ? '取消退回' : '退回'}
						</button>
					</div>

					{#if showRejectForm}
						<form method="POST" action="?/reject" style="margin-top:16px;">
							<div class="form-group">
								<label for="review_note">退回原因（必填）</label>
								<textarea id="review_note" name="review_note" bind:value={rejectNote} placeholder="请说明退回原因，该原因将记录到操作时间线" required></textarea>
							</div>
							<button type="submit" class="btn btn-danger">确认退回</button>
						</form>
					{/if}
				</div>
			</div>
		{/if}

		{#if canCancel}
			<div class="card" style="margin-top:20px;">
				<div class="card-body" style="display:flex;align-items:center;gap:16px;">
					<span style="color:var(--c-text-2);font-size:13px;">该充值单仍在待审核状态</span>
					<form method="POST" action="?/cancel">
						<button type="submit" class="btn btn-sm" style="color:var(--c-danger);border-color:var(--c-danger);">取消充值</button>
					</form>
				</div>
			</div>
		{/if}

		{#if canResubmit}
			<div class="card" style="margin-top:20px;">
				<div class="card-header" style="color:var(--c-danger);">退回通知</div>
				<div class="card-body">
					{#if data.recharge.review_note}
						<div class="alert alert-danger" style="margin-bottom:16px;">
							<strong>退回原因：</strong>{data.recharge.review_note}
						</div>
					{/if}
					<p style="font-size:13px;color:var(--c-text-2);margin-bottom:16px;">
						该充值已被退回。请根据退回原因核实信息后，重新提交充值申请。
					</p>
					<a href="/recharges/new" class="btn btn-primary">重新提交充值</a>
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
								{#if (log as any).action === 'create'}提交充值
								{:else if (log as any).action === 'approve'}审核通过
								{:else if (log as any).action === 'reject'}退回
								{:else if (log as any).action === 'cancel'}取消充值
								{:else}{(log as any).action}{/if}
							</div>
							<div class="tl-detail">{(log as any).detail}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
