<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/stores';
	import {
		STATUS_LABELS,
		STATUS_COLORS,
		ROLE_LABELS,
		SEVERITY_LABELS,
		DAMAGE_STATUS_LABELS,
		REPAIR_STATUS_LABELS
	} from '$lib/types';
	import type {
		DeliveryDetail,
		TimelineEvent,
		DamageReport,
		RepairFollowup,
		User
	} from '$lib/types';

	let loading = true;
	let delivery: DeliveryDetail | null = null;
	let timeline: TimelineEvent[] = [];
	let users: User[] = [];

	let showDamageForm = false;
	let showRepairFormFor: number | null = null;
	let showReviewFormFor: number | null = null;
	let showPaymentForm = false;
	let activeTab: 'timeline' | 'damage' | 'repair' = 'timeline';

	let damageForm = {
		damage_type: '',
		description: '',
		severity: 'moderate' as 'minor' | 'moderate' | 'severe',
		estimated_cost: '',
		materials_provided: '',
		materials_missing: ''
	};

	let repairForm = {
		assigned_to: '',
		repair_type: '',
		repair_description: ''
	};

	let reviewForm = {
		approved: true,
		review_comment: ''
	};

	let paymentForm = {
		amount: '',
		payment_type: 'repair_fee',
		notes: ''
	};

	let submitLoading = false;

	onMount(async () => {
		await Promise.all([loadDetail(), loadUsers()]);
		loading = false;
	});

	async function loadDetail() {
		const id = $page.params.id;
		const res = await fetch(`/api/deliveries/${id}`);
		const data = await res.json();
		delivery = data.delivery;
		timeline = data.timeline;
	}

	async function loadUsers() {
		const res = await fetch('/api/users');
		users = await res.json();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	function formatDateTime(dateStr: string): string {
		return new Date(dateStr).toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getRoleLabel(role: string): string {
		return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
	}

	function getStatusLabel(status: unknown): string {
		return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || String(status);
	}

	function getStatusColor(status: unknown): string {
		return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
	}

	function getTimelineIcon(type: string): string {
		switch (type) {
			case 'status':
				return '🔄';
			case 'damage':
				return '🔍';
			case 'repair':
				return '🔧';
			case 'payment':
				return '💰';
			default:
				return '📝';
		}
	}

	function getTimelineColor(type: string): string {
		switch (type) {
			case 'status':
				return 'bg-blue-500';
			case 'damage':
				return 'bg-orange-500';
			case 'repair':
				return 'bg-purple-500';
			case 'payment':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
		}
	}

	const canCreateDamage = () => {
		if (!$currentUser || !delivery) return false;
		if ($currentUser.role !== 'store_clerk') return false;
		return ['PENDING_RETURN', 'RETURNED', 'DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'REVIEW_REJECTED'].includes(delivery.status);
	};

	const canReviewDamage = (damage: DamageReport) => {
		if (!$currentUser || !delivery) return false;
		if ($currentUser.role !== 'equipment_manager') return false;
		if (damage.status !== 'PENDING_REVIEW') return false;
		return ['DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'PENDING_REVIEW'].includes(delivery.status);
	};

	const canCreateRepair = (damage: DamageReport) => {
		if (!$currentUser || !delivery) return false;
		if ($currentUser.role !== 'equipment_manager') return false;
		if (damage.status !== 'APPROVED') return false;
		if (damage.repair_followups && damage.repair_followups.length > 0) return false;
		return delivery.status === 'REPAIR_PENDING';
	};

	const canUpdateRepair = (repair: RepairFollowup) => {
		if (!$currentUser || !delivery) return false;
		if ($currentUser.role !== 'equipment_manager') return false;
		if (repair.repair_status === 'PENDING' && delivery.status === 'REPAIR_PENDING') return true;
		if (repair.repair_status === 'IN_PROGRESS' && delivery.status === 'REPAIR_IN_PROGRESS') return true;
		return false;
	};

	const canConfirmPayment = () => {
		if (!$currentUser || !delivery) return false;
		if ($currentUser.role !== 'finance') return false;
		return ['REPAIR_COMPLETED', 'OVERDUE'].includes(delivery.status);
	};

	const canClose = () => {
		if (!$currentUser || !delivery) return false;
		return ['FINANCIAL_CONFIRMED', 'OVERDUE'].includes(delivery.status);
	};

	async function submitDamage() {
		if (!$currentUser || !delivery) return;
		submitLoading = true;

		try {
			const res = await fetch(`/api/deliveries/${delivery.id}/damage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reported_by: $currentUser.id,
					...damageForm
				})
			});

			if (res.ok) {
				showDamageForm = false;
				damageForm = {
					damage_type: '',
					description: '',
					severity: 'moderate',
					estimated_cost: '',
					materials_provided: '',
					materials_missing: ''
				};
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}

	async function submitReview(damageId: number) {
		if (!$currentUser) return;
		submitLoading = true;

		try {
			const res = await fetch(`/api/damage/${damageId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reviewer_id: $currentUser.id,
					approved: reviewForm.approved,
					review_comment: reviewForm.review_comment
				})
			});

			if (res.ok) {
				showReviewFormFor = null;
				reviewForm = { approved: true, review_comment: '' };
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}

	async function submitRepair(damageId: number) {
		if (!$currentUser) return;
		submitLoading = true;

		try {
			const res = await fetch(`/api/damage/${damageId}/repair`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					created_by: $currentUser.id,
					...repairForm
				})
			});

			if (res.ok) {
				showRepairFormFor = null;
				repairForm = { assigned_to: '', repair_type: '', repair_description: '' };
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}

	async function updateRepairStatus(
		repairId: number,
		status: 'IN_PROGRESS' | 'REPAIR_COMPLETED'
	) {
		if (!$currentUser) return;

		const notes = prompt(status === 'IN_PROGRESS' ? '请输入维修开始备注：' : '请输入维修完成备注：');
		if (notes === null) return;

		const actualCost = status === 'REPAIR_COMPLETED' ? prompt('请输入实际维修费用：') : null;
		if (status === 'REPAIR_COMPLETED' && actualCost === null) return;

		submitLoading = true;

		try {
			const res = await fetch(`/api/repair/${repairId}/status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					user_id: $currentUser.id,
					notes,
					actual_cost: actualCost
				})
			});

			if (res.ok) {
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}

	async function submitPayment() {
		if (!$currentUser || !delivery) return;
		submitLoading = true;

		try {
			const res = await fetch(`/api/deliveries/${delivery.id}/payment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					confirmed_by: $currentUser.id,
					...paymentForm
				})
			});

			if (res.ok) {
				showPaymentForm = false;
				paymentForm = { amount: '', payment_type: 'repair_fee', notes: '' };
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}

	async function closeDelivery() {
		if (!$currentUser || !delivery) return;
		const reason = prompt('请输入结案原因：');
		if (!reason) return;

		if (!confirm('确定要结案吗？结案后不可修改。')) return;

		submitLoading = true;

		try {
			const res = await fetch(`/api/deliveries/${delivery.id}/close`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: $currentUser.id,
					reason
				})
			});

			if (res.ok) {
				await loadDetail();
			} else {
				const err = await res.json();
				alert(err.message || '提交失败');
			}
		} finally {
			submitLoading = false;
		}
	}
</script>

{#if loading}
	<div class="flex justify-center items-center h-64">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
	</div>
{:else if !delivery}
	<div class="text-center py-12">
		<p class="text-gray-500">租赁单不存在</p>
		<a href="/" class="mt-4 inline-block text-blue-600 hover:underline">← 返回列表</a>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<a href="/" class="text-gray-500 hover:text-gray-700">← 返回列表</a>
				<h2 class="text-2xl font-bold text-gray-900">租赁单详情</h2>
				<span class="font-mono text-lg text-gray-600">{delivery.delivery_no}</span>
			</div>
			<span
				class="px-4 py-1.5 inline-flex text-sm font-semibold rounded-full {STATUS_COLORS[delivery.status]}"
			>
				{STATUS_LABELS[delivery.status]}
			</span>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-1 space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📋 基本信息</h3>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-gray-500">客户姓名</span>
							<span class="font-medium">{delivery.customer_name}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-500">联系电话</span>
							<span class="font-medium">{delivery.customer_phone || '-'}</span>
						</div>
						<div class="border-t pt-3">
							<p class="text-gray-500 text-sm mb-1">器材名称</p>
							<p class="font-medium">{delivery.equipment_name}</p>
							<p class="text-sm text-gray-600">
								{delivery.equipment_model || ''}
								{delivery.serial_no ? ` · ${delivery.serial_no}` : ''}
							</p>
						</div>
						<div class="border-t pt-3">
							<div class="flex justify-between">
								<span class="text-gray-500">起租日期</span>
								<span>{formatDate(delivery.rental_start_date)}</span>
							</div>
							<div class="flex justify-between mt-1">
								<span class="text-gray-500">应还日期</span>
								<span>{formatDate(delivery.expected_return_date)}</span>
							</div>
							{#if delivery.actual_return_date}
								<div class="flex justify-between mt-1">
									<span class="text-gray-500">实还日期</span>
									<span>{formatDate(delivery.actual_return_date)}</span>
								</div>
							{/if}
						</div>
						<div class="border-t pt-3">
							<div class="flex justify-between">
								<span class="text-gray-500">押金</span>
								<span class="font-semibold">¥{delivery.deposit_amount.toFixed(0)}</span>
							</div>
							<div class="flex justify-between mt-1">
								<span class="text-gray-500">租金</span>
								<span class="font-semibold">¥{delivery.rental_fee.toFixed(0)}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ 快捷操作</h3>
					<div class="space-y-3">
						{#if canCreateDamage()}
							<button
								on:click={() => (showDamageForm = true)}
								disabled={submitLoading}
								class="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
							>
								🔍 提交损坏鉴定
							</button>
						{/if}
						{#if canConfirmPayment()}
							<button
								on:click={() => (showPaymentForm = true)}
								disabled={submitLoading}
								class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
							>
								💰 财务确认
							</button>
						{/if}
						{#if canClose()}
							<button
								on:click={closeDelivery}
								disabled={submitLoading}
								class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
							>
								✅ 结案
							</button>
						{/if}
						{#if !canCreateDamage() && !canConfirmPayment() && !canClose()}
							{#if !$currentUser}
								<p class="text-sm text-gray-500 text-center py-2">请先登录以进行操作</p>
							{:else}
								<p class="text-sm text-gray-500 text-center py-2">当前状态无可执行操作</p>
							{/if}
						{/if}
					</div>
				</div>
			</div>

			<div class="lg:col-span-2 space-y-6">
				<div class="bg-white rounded-lg shadow">
					<div class="border-b px-4 py-3 flex space-x-8">
						<button
							on:click={() => (activeTab = 'timeline')}
							class="py-2 px-1 font-medium text-sm border-b-2 transition-colors"
							class:border-blue-500={activeTab === 'timeline'}
							class:text-blue-600={activeTab === 'timeline'}
							class:border-transparent={activeTab !== 'timeline'}
							class:text-gray-500={activeTab !== 'timeline'}
						>
							⏱️ 时间线 ({timeline.length})
						</button>
						<button
							on:click={() => (activeTab = 'damage')}
							class="py-2 px-1 font-medium text-sm border-b-2 transition-colors"
							class:border-blue-500={activeTab === 'damage'}
							class:text-blue-600={activeTab === 'damage'}
							class:border-transparent={activeTab !== 'damage'}
							class:text-gray-500={activeTab !== 'damage'}
						>
							🔍 损坏鉴定 ({delivery.damage_reports.length})
						</button>
						<button
							on:click={() => (activeTab = 'repair')}
							class="py-2 px-1 font-medium text-sm border-b-2 transition-colors"
							class:border-blue-500={activeTab === 'repair'}
							class:text-blue-600={activeTab === 'repair'}
							class:border-transparent={activeTab !== 'repair'}
							class:text-gray-500={activeTab !== 'repair'}
						>
							🔧 维修跟进 (
							{delivery.damage_reports.reduce((sum, d) => sum + (d.repair_followups?.length || 0), 0)})
						</button>
					</div>

					<div class="p-6">
						{#if activeTab === 'timeline'}
							<div class="relative">
								{#if timeline.length === 0}
									<p class="text-gray-500 text-center py-8">暂无时间线记录</p>
								{:else}
									<div class="space-y-6">
										{#each timeline as event}
											<div class="flex space-x-4">
												<div class="flex flex-col items-center">
													<div
														class="w-10 h-10 rounded-full {getTimelineColor(event.type)} flex items-center justify-center text-white text-lg flex-shrink-0"
													>
														{getTimelineIcon(event.type)}
													</div>
													<div class="w-0.5 h-full bg-gray-200 -mt-2"></div>
												</div>
												<div class="flex-1 pb-6">
													<div class="flex items-center justify-between">
														<h4 class="font-semibold text-gray-900">{event.title}</h4>
														<span class="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
													</div>
													{#if event.description}
														<p class="text-gray-600 text-sm mt-1">{event.description}</p>
													{/if}
													<div class="flex items-center space-x-2 mt-2">
														<span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
															{event.operator}
														</span>
														<span class="text-xs text-gray-500">
															{getRoleLabel(event.operator_role)}
														</span>
													</div>
													{#if event.metadata && event.metadata.new_status}
														<div class="mt-2 flex items-center space-x-2">
															<span class="text-xs text-gray-500">状态:</span>
															<span
																class="text-xs px-2 py-0.5 rounded-full {getStatusColor(event.metadata.new_status)}"
															>
																{getStatusLabel(event.metadata.new_status)}
															</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{:else if activeTab === 'damage'}
							<div class="space-y-6">
								{#if delivery.damage_reports.length === 0}
									<div class="text-center py-8">
										<p class="text-gray-500">暂无损坏鉴定记录</p>
										{#if canCreateDamage()}
											<button
												on:click={() => (showDamageForm = true)}
												class="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
											>
												+ 提交损坏鉴定
											</button>
										{/if}
									</div>
								{:else}
									{#each delivery.damage_reports as damage}
										<div class="border rounded-lg p-5 bg-gray-50">
											<div class="flex items-start justify-between">
												<div class="flex-1">
													<div class="flex items-center space-x-3">
														<h4 class="font-semibold text-gray-900">{damage.damage_type}</h4>
														<span
															class="text-xs px-2 py-0.5 rounded-full {damage.severity === 'severe'
																? 'bg-red-100 text-red-800'
																: damage.severity === 'moderate'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-green-100 text-green-800'}"
														>
															{SEVERITY_LABELS[damage.severity]}
														</span>
														<span
															class="text-xs px-2 py-0.5 rounded-full {damage.status === 'APPROVED'
																? 'bg-green-100 text-green-800'
																: damage.status === 'PENDING_REVIEW'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-red-100 text-red-800'}"
														>
															{DAMAGE_STATUS_LABELS[damage.status] || damage.status}
														</span>
													</div>
													<p class="text-gray-600 text-sm mt-2">{damage.description}</p>

													<div class="mt-3 grid grid-cols-2 gap-4 text-sm">
														{#if damage.estimated_cost}
															<div>
																<span class="text-gray-500">预估费用：</span>
																<span class="font-medium">¥{damage.estimated_cost}</span>
															</div>
														{/if}
														{#if damage.materials_provided}
															<div>
																<span class="text-gray-500">提供材料：</span>
																<span>{damage.materials_provided}</span>
															</div>
														{/if}
														{#if damage.materials_missing}
															<div class="col-span-2">
																<span class="text-red-600 font-medium">📦 缺少材料：</span>
																<span class="text-red-700">{damage.materials_missing}</span>
															</div>
														{/if}
													</div>

													<div class="mt-3 flex items-center space-x-2 text-xs text-gray-500">
														<span>提交人：{damage.reporter?.name}</span>
														<span>·</span>
														<span>{formatDateTime(damage.created_at)}</span>
													</div>

													{#if damage.reviewed_at}
														<div class="mt-4 p-3 bg-white rounded border">
															<div class="flex items-center justify-between">
																<div class="flex items-center space-x-2">
																	<span class="text-sm font-medium text-gray-700">
																		{damage.status === 'APPROVED' ? '✅ 复核通过' : '❌ 复核不通过'}
																	</span>
																	<span class="text-xs text-gray-500">
																		by {damage.reviewer?.name} · {formatDateTime(damage.reviewed_at)}
																	</span>
																</div>
															</div>
															{#if damage.review_comment}
																<p class="text-sm text-gray-600 mt-2">{damage.review_comment}</p>
															{/if}
														</div>
													{/if}
												</div>

												<div class="ml-4 flex-shrink-0 space-y-2">
													{#if canReviewDamage(damage)}
														<button
															on:click={() => {
																showReviewFormFor = damage.id;
																reviewForm = { approved: true, review_comment: '' };
															}}
															disabled={submitLoading}
															class="block px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
														>
															复核
														</button>
													{/if}
													{#if canCreateRepair(damage)}
														<button
															on:click={() => {
																showRepairFormFor = damage.id;
																repairForm = { assigned_to: '', repair_type: '', repair_description: '' };
															}}
															disabled={submitLoading}
															class="block px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
														>
															安排维修
														</button>
													{/if}
												</div>
											</div>

											{#if damage.repair_followups && damage.repair_followups.length > 0}
												<div class="mt-4 border-t pt-4">
													<h5 class="text-sm font-medium text-gray-700 mb-3">🔧 维修跟进记录</h5>
													<div class="space-y-3">
														{#each damage.repair_followups as repair}
															<div class="p-3 bg-white rounded border">
																<div class="flex items-center justify-between">
																	<div class="flex items-center space-x-2">
																		<span class="font-medium text-sm">{repair.repair_type}</span>
																		<span
																			class="text-xs px-2 py-0.5 rounded-full {repair.repair_status === 'REPAIR_COMPLETED'
																				? 'bg-green-100 text-green-800'
																				: repair.repair_status === 'IN_PROGRESS'
																					? 'bg-blue-100 text-blue-800'
																					: 'bg-gray-100 text-gray-800'}"
																		>
																			{REPAIR_STATUS_LABELS[repair.repair_status]}
																		</span>
																	</div>
																	<div class="flex space-x-2">
																		{#if canUpdateRepair(repair)}
																			{#if repair.repair_status === 'PENDING'}
																				<button
																					on:click={() => updateRepairStatus(repair.id, 'IN_PROGRESS')}
																					disabled={submitLoading}
																					class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
																				>
																					开始维修
																				</button>
																			{/if}
																			{#if repair.repair_status === 'IN_PROGRESS'}
																				<button
																					on:click={() => updateRepairStatus(repair.id, 'REPAIR_COMPLETED')}
																					disabled={submitLoading}
																					class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
																				>
																					完成维修
																				</button>
																			{/if}
																		{/if}
																	</div>
																</div>
																{#if repair.repair_description}
																	<p class="text-sm text-gray-600 mt-2">{repair.repair_description}</p>
																{/if}
																<div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
																	<div>负责人：{repair.assignee?.name}</div>
																	<div>创建人：{repair.creator?.name}</div>
																	{#if repair.repair_start_date}
																		<div>开始日期：{formatDate(repair.repair_start_date)}</div>
																	{/if}
																	{#if repair.repair_complete_date}
																		<div>完成日期：{formatDate(repair.repair_complete_date)}</div>
																	{/if}
																	{#if repair.actual_cost}
																		<div class="col-span-2">
																			实际费用：<span class="font-medium text-gray-900">¥{repair.actual_cost}</span>
																		</div>
																	{/if}
																	{#if repair.repair_notes}
																		<div class="col-span-2">
																			备注：{repair.repair_notes}
																		</div>
																	{/if}
																</div>
															</div>
														{/each}
													</div>
												</div>
											{/if}

											{#if showReviewFormFor === damage.id}
												<div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
													<h5 class="font-medium text-blue-900 mb-3">复核损坏鉴定</h5>
													<div class="space-y-3">
														<div>
															<label class="block text-sm font-medium text-gray-700 mb-1">复核结果</label>
															<div class="flex space-x-4">
																<label class="flex items-center space-x-2">
																	<input
																		type="radio"
																		bind:group={reviewForm.approved}
																		value={true}
																		class="text-green-600"
																	/>
																	<span class="text-sm text-green-700">✅ 通过</span>
																</label>
																<label class="flex items-center space-x-2">
																	<input
																		type="radio"
																		bind:group={reviewForm.approved}
																		value={false}
																		class="text-red-600"
																	/>
																	<span class="text-sm text-red-700">❌ 不通过</span>
																</label>
															</div>
														</div>
														<div>
															<label class="block text-sm font-medium text-gray-700 mb-1">复核意见</label>
															<textarea
																bind:value={reviewForm.review_comment}
																class="w-full px-3 py-2 border rounded-lg text-sm"
																rows={3}
																placeholder="请输入复核意见..."
															/>
														</div>
														<div class="flex space-x-2">
															<button
																on:click={() => submitReview(damage.id)}
																disabled={submitLoading || !reviewForm.review_comment}
																class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
															>
																提交
															</button>
															<button
																on:click={() => (showReviewFormFor = null)}
																class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
															>
																取消
															</button>
														</div>
													</div>
												</div>
											{/if}

											{#if showRepairFormFor === damage.id}
												<div class="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
													<h5 class="font-medium text-purple-900 mb-3">安排维修</h5>
													<div class="space-y-3">
														<div>
															<label class="block text-sm font-medium text-gray-700 mb-1">维修负责人</label>
															<select
																bind:value={repairForm.assigned_to}
																class="w-full px-3 py-2 border rounded-lg text-sm"
															>
																<option value="">请选择</option>
																{#each users.filter((u) => u.role === 'equipment_manager') as user}
																	<option value={user.id}>{user.name}</option>
																{/each}
															</select>
														</div>
														<div>
															<label class="block text-sm font-medium text-gray-700 mb-1">维修类型</label>
															<input
																type="text"
																bind:value={repairForm.repair_type}
																class="w-full px-3 py-2 border rounded-lg text-sm"
																placeholder="如：镜头维修、机身清洁等"
															/>
														</div>
														<div>
															<label class="block text-sm font-medium text-gray-700 mb-1">维修说明</label>
															<textarea
																bind:value={repairForm.repair_description}
																class="w-full px-3 py-2 border rounded-lg text-sm"
																rows={3}
																placeholder="详细描述维修内容..."
															/>
														</div>
														<div class="flex space-x-2">
															<button
																on:click={() => submitRepair(damage.id)}
																disabled={submitLoading
																	|| !repairForm.assigned_to
																	|| !repairForm.repair_type
																	|| !repairForm.repair_description}
																class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
															>
																提交
															</button>
															<button
																on:click={() => (showRepairFormFor = null)}
																class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
															>
																取消
															</button>
														</div>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								{/if}
							</div>
						{:else if activeTab === 'repair'}
							<div class="space-y-6">
								{#if delivery.damage_reports.reduce((sum, d) => sum + (d.repair_followups?.length || 0), 0) === 0}
									<div class="text-center py-8">
										<p class="text-gray-500">暂无维修记录</p>
									</div>
								{:else}
									{#each delivery.damage_reports as damage}
										{#if damage.repair_followups && damage.repair_followups.length > 0}
											<div class="mb-6">
												<h4 class="font-medium text-gray-900 mb-3">
													🔍 {damage.damage_type} - 维修记录
												</h4>
												{#each damage.repair_followups as repair}
													<div class="border rounded-lg p-5 bg-gray-50 mb-4">
														<div class="flex items-start justify-between">
															<div class="flex-1">
																<div class="flex items-center space-x-3">
																	<h5 class="font-semibold text-gray-900">
																		{repair.repair_type}
																	</h5>
																	<span
																		class="text-xs px-2 py-0.5 rounded-full {repair.repair_status === 'REPAIR_COMPLETED'
																			? 'bg-green-100 text-green-800'
																			: repair.repair_status === 'IN_PROGRESS'
																				? 'bg-blue-100 text-blue-800'
																				: 'bg-gray-100 text-gray-800'}"
																	>
																		{REPAIR_STATUS_LABELS[repair.repair_status]}
																	</span>
																</div>
																<p class="text-gray-600 text-sm mt-2">
																	{repair.repair_description}
																</p>

																<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
																	<div>
																		<span class="text-gray-500">负责人：</span>
																		<span class="font-medium">{repair.assignee?.name}</span>
																	</div>
																	<div>
																		<span class="text-gray-500">创建人：</span>
																		<span class="font-medium">{repair.creator?.name}</span>
																	</div>
																	{#if repair.repair_start_date}
																		<div>
																			<span class="text-gray-500">开始日期：</span>
																			<span>{formatDate(repair.repair_start_date)}</span>
																		</div>
																	{/if}
																	{#if repair.repair_complete_date}
																		<div>
																			<span class="text-gray-500">完成日期：</span>
																			<span>{formatDate(repair.repair_complete_date)}</span>
																		</div>
																	{/if}
																	{#if repair.actual_cost}
																		<div class="col-span-2">
																			<span class="text-gray-500">实际费用：</span>
																			<span class="font-semibold text-lg text-green-600">
																				¥{repair.actual_cost.toFixed(0)}
																			</span>
																		</div>
																	{/if}
																	{#if repair.repair_notes}
																		<div class="col-span-2">
																			<span class="text-gray-500">备注：</span>
																			<span>{repair.repair_notes}</span>
																		</div>
																	{/if}
																</div>
															</div>

															<div class="flex flex-col space-y-2 ml-4">
																{#if canUpdateRepair(repair)}
																	{#if repair.repair_status === 'PENDING'}
																		<button
																			on:click={() => updateRepairStatus(repair.id, 'IN_PROGRESS')}
																			disabled={submitLoading}
																			class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
																		>
																			开始维修
																		</button>
																	{/if}
																	{#if repair.repair_status === 'IN_PROGRESS'}
																		<button
																			on:click={() => updateRepairStatus(repair.id, 'REPAIR_COMPLETED')}
																			disabled={submitLoading}
																			class="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
																		>
																			完成维修
																		</button>
																	{/if}
																{/if}
															</div>
														</div>
													</div>
												{/each}
											</div>
										{/if}
									{/each}

									{#if delivery.payments.length > 0}
										<div class="mt-8">
											<h4 class="font-medium text-gray-900 mb-3">💰 费用记录</h4>
											<div class="space-y-3">
												{#each delivery.payments as payment}
													<div class="border rounded-lg p-4 bg-green-50">
														<div class="flex items-center justify-between">
															<div>
																<span class="font-medium text-gray-900">
																	{payment.payment_type === 'repair_fee' ? '维修费' : payment.payment_type}
																</span>
																<span class="text-2xl font-bold text-green-600 ml-4">
																	¥{payment.amount.toFixed(0)}
																</span>
															</div>
															<div class="text-right text-xs text-gray-500">
																<p>确认人：{payment.confirmer?.name}</p>
																<p>{formatDateTime(payment.confirmed_at)}</p>
															</div>
														</div>
														{#if payment.notes}
															<p class="text-sm text-gray-600 mt-2">{payment.notes}</p>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		{#if showDamageForm}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
					<div class="p-6 border-b">
						<h3 class="text-lg font-semibold text-gray-900">🔍 提交损坏鉴定</h3>
					</div>
					<div class="p-6 space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">损坏类型 *</label>
							<input
								type="text"
								bind:value={damageForm.damage_type}
								class="w-full px-3 py-2 border rounded-lg"
								placeholder="如：镜头划痕、机身磕碰等"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
							<textarea
								bind:value={damageForm.description}
								class="w-full px-3 py-2 border rounded-lg"
								rows={3}
								placeholder="请详细描述损坏情况..."
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">损坏程度 *</label>
							<select bind:value={damageForm.severity} class="w-full px-3 py-2 border rounded-lg">
								<option value="minor">轻微</option>
								<option value="moderate">中等</option>
								<option value="severe">严重</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">预估维修费用</label>
							<input
								type="number"
								bind:value={damageForm.estimated_cost}
								class="w-full px-3 py-2 border rounded-lg"
								placeholder="如：500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">已提供材料</label>
							<input
								type="text"
								bind:value={damageForm.materials_provided}
								class="w-full px-3 py-2 border rounded-lg"
								placeholder="如：机身、镜头盖、说明书等"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-red-700 mb-1">⚠️ 缺少材料</label>
							<input
								type="text"
								bind:value={damageForm.materials_missing}
								class="w-full px-3 py-2 border rounded-lg border-red-300 focus:border-red-500"
								placeholder="如有缺失请填写，如：原装电池、充电器等"
							/>
						</div>
					</div>
					<div class="p-6 border-t bg-gray-50 flex justify-end space-x-3">
						<button
							on:click={() => (showDamageForm = false)}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
						>
							取消
						</button>
						<button
							on:click={submitDamage}
							disabled={submitLoading
								|| !damageForm.damage_type
								|| !damageForm.description}
							class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
						>
							提交鉴定
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showPaymentForm}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
					<div class="p-6 border-b">
						<h3 class="text-lg font-semibold text-gray-900">💰 财务确认</h3>
					</div>
					<div class="p-6 space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
							<input
								type="number"
								bind:value={paymentForm.amount}
								class="w-full px-3 py-2 border rounded-lg"
								placeholder="如：600"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">费用类型</label>
							<select bind:value={paymentForm.payment_type} class="w-full px-3 py-2 border rounded-lg">
								<option value="repair_fee">维修费</option>
								<option value="damage_compensation">损坏赔偿</option>
								<option value="missing_compensation">缺失赔偿</option>
								<option value="overdue_fee">逾期费</option>
								<option value="deposit_refund">押金退还</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
							<textarea
								bind:value={paymentForm.notes}
								class="w-full px-3 py-2 border rounded-lg"
								rows={2}
								placeholder="备注说明..."
							/>
						</div>
						<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p class="text-sm text-yellow-800">
								💡 当前押金：¥{delivery.deposit_amount.toFixed(0)}
								{#if delivery.damage_reports.length > 0}
									<br />预估维修费用：¥
									{delivery.damage_reports
										.filter((d) => d.estimated_cost)
										.reduce((sum, d) => sum + (d.estimated_cost || 0), 0)
										.toFixed(0)}
								{/if}
							</p>
						</div>
					</div>
					<div class="p-6 border-t bg-gray-50 flex justify-end space-x-3">
						<button
							on:click={() => (showPaymentForm = false)}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
						>
							取消
						</button>
						<button
							on:click={submitPayment}
							disabled={submitLoading || !paymentForm.amount}
							class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
						>
							确认
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
