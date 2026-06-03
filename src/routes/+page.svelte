<script lang="ts">
	import { onMount } from 'svelte';
	import {
		STATUS_LABELS,
		STATUS_COLORS,
		ROLE_LABELS
	} from '$lib/types';
	import type { Delivery, DeliveryStatus } from '$lib/types';
	import { currentUser } from '$lib/stores';

	let deliveries: Delivery[] = [];
	let loading = true;
	let activeFilter: string = 'all';

	const filters = [
		{ key: 'all', label: '全部' },
		{ key: 'MATERIALS_MISSING', label: '缺材料', badge: true },
		{ key: 'OVERDUE', label: '超时', badge: true },
		{ key: 'REVIEW_REJECTED', label: '复核不通过', badge: true },
		{ key: 'PENDING_REVIEW', label: '待复核' },
		{ key: 'REPAIR_IN_PROGRESS', label: '维修中' },
		{ key: 'REPAIR_COMPLETED', label: '维修完成' },
		{ key: 'FINANCIAL_CONFIRMED', label: '财务已确认' },
		{ key: 'CLOSED', label: '已结案' }
	];

	onMount(async () => {
		await loadDeliveries();
	});

	async function loadDeliveries(status?: string) {
		loading = true;
		const url = status && status !== 'all' ? `/api/deliveries?status=${status}` : '/api/deliveries';
		const res = await fetch(url);
		deliveries = await res.json();
		loading = false;
	}

	function filterByStatus(key: string) {
		activeFilter = key;
		loadDeliveries(key);
	}

	function getStatusCount(status: string): number {
		return deliveries.filter((d) => d.display_status === status).length;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	function isOverdue(delivery: Delivery): boolean {
		return delivery.display_status === 'OVERDUE';
	}

	const canCreateDamage = (delivery: Delivery) => {
		if (!$currentUser) return false;
		if ($currentUser.role !== 'store_clerk') return false;
		return ['PENDING_RETURN', 'RETURNED', 'DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'REVIEW_REJECTED'].includes(delivery.status);
	};
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">租赁单管理</h2>
			<p class="mt-1 text-sm text-gray-600">
				异常单：<span class="font-medium text-red-600">
					{deliveries.filter((d) => ['MATERIALS_MISSING', 'OVERDUE', 'REVIEW_REJECTED'].includes(d.display_status)).length}
				</span> 单
			</p>
		</div>
		{#if !$currentUser}
			<div class="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p class="text-sm text-yellow-800">⚠️ 请先在右上角选择角色登录</p>
			</div>
		{/if}
	</div>

	<div class="bg-white rounded-lg shadow">
		<div class="border-b px-4 py-3 overflow-x-auto">
			<div class="flex space-x-1">
				{#each filters as filter}
					<button
						on:click={() => filterByStatus(filter.key)}
						class="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
						class:bg-blue-600={activeFilter === filter.key}
						class:text-white={activeFilter === filter.key}
						class:bg-gray-100={activeFilter !== filter.key}
						class:text-gray-700={activeFilter !== filter.key}
						class:hover:bg-gray-200={activeFilter !== filter.key}
					>
						{filter.label}
						{#if filter.badge && getStatusCount(filter.key) > 0}
							<span
								class="ml-1.5 px-2 py-0.5 text-xs rounded-full"
								class:bg-white={activeFilter === filter.key}
								class:bg-red-500={activeFilter !== filter.key}
								class:text-blue-600={activeFilter === filter.key}
								class:text-white={activeFilter !== filter.key}
							>
								{getStatusCount(filter.key)}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="p-12 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">加载中...</p>
			</div>
		{:else if deliveries.length === 0}
			<div class="p-12 text-center">
				<p class="text-gray-500">暂无数据</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								租赁单号
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								客户
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								器材
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								日期
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								押金/租金
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								状态
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								操作
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each deliveries as delivery}
							<tr
								class="hover:bg-gray-50 transition-colors"
								class:bg-red-50={isOverdue(delivery)}
								class:bg-yellow-50={delivery.display_status === 'MATERIALS_MISSING'}
								class:bg-orange-50={delivery.display_status === 'REVIEW_REJECTED'}
							>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="font-mono text-sm font-medium text-gray-900">{delivery.delivery_no}</span>
									{#if isOverdue(delivery)}
										<span class="ml-2 text-xs text-red-600 font-medium">⚠️ 超时</span>
									{/if}
									{#if delivery.display_status === 'MATERIALS_MISSING'}
										<span class="ml-2 text-xs text-red-600 font-medium">📦 缺材料</span>
									{/if}
									{#if delivery.display_status === 'REVIEW_REJECTED'}
										<span class="ml-2 text-xs text-orange-600 font-medium">❌ 复核不通过</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">{delivery.customer_name}</div>
									<div class="text-xs text-gray-500">{delivery.customer_phone || '-'}</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-gray-900">{delivery.equipment_name}</div>
									<div class="text-xs text-gray-500">
										{delivery.equipment_model || ''}
										{delivery.serial_no ? ` · ${delivery.serial_no}` : ''}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									<div>起租: {formatDate(delivery.rental_start_date)}</div>
									<div>应还: <span class:font-medium={isOverdue(delivery)} class:text-red-600={isOverdue(delivery)}>{formatDate(delivery.expected_return_date)}</span></div>
									{#if delivery.actual_return_date}
										<div class="text-gray-600">实还: {formatDate(delivery.actual_return_date)}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									<div>押金: <span class="font-medium">¥{delivery.deposit_amount.toFixed(0)}</span></div>
									<div>租金: ¥{delivery.rental_fee.toFixed(0)}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {STATUS_COLORS[delivery.display_status]}"
									>
										{STATUS_LABELS[delivery.display_status]}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<a
										href="/deliveries/{delivery.id}"
										class="text-blue-600 hover:text-blue-900 font-medium"
									>
										查看详情 →
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
