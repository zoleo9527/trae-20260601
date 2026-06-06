<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate } from '$lib/utils/format';
	import { Plus, Search, Filter, Eye, Check, X } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let searchInput = $state(data.filters.search || '');
	let statusFilter = $state(data.filters.status || '');

	function handleSearch() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (searchInput.trim()) params.set('search', searchInput.trim());
		goto(`/consumption?${params.toString()}`);
	}

	function handleStatusChange(e: Event) {
		statusFilter = (e.target as HTMLSelectElement).value;
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (searchInput.trim()) params.set('search', searchInput.trim());
		goto(`/consumption?${params.toString()}`);
	}

	function canManage(userRole: string): boolean {
		return ['consultant', 'admin'].includes(userRole);
	}

	function canConfirm(userRole: string): boolean {
		return ['teacher', 'admin'].includes(userRole);
	}
</script>

<div class="space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">课包消耗</h1>
				<p class="text-gray-500 mt-1">管理和查看所有课消记录</p>
			</div>
			{#if canManage(data.user.role)}
				<a
					href="/consumption/new"
					class="inline-flex items-center px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium shadow-sm"
				>
					<Plus size={18} class="mr-2" />
					新增课消
				</a>
			{/if}
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
			<div class="flex flex-col md:flex-row gap-4">
				<div class="flex-1">
					<label class="block text-sm font-medium text-gray-700 mb-1.5">
						<Search size={14} class="inline mr-1" />
						搜索学生
					</label>
					<div class="relative">
						<input
							type="text"
							bind:value={searchInput}
							onkeydown={(e) => e.key === 'Enter' && handleSearch()}
							placeholder="输入学生姓名搜索"
							class="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
						/>
						<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					</div>
				</div>
				<div class="w-full md:w-48">
					<label class="block text-sm font-medium text-gray-700 mb-1.5">
						<Filter size={14} class="inline mr-1" />
						状态筛选
					</label>
					<select
						bind:value={statusFilter}
						onchange={handleStatusChange}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
					>
						<option value="">全部状态</option>
						<option value="pending">待确认</option>
						<option value="confirmed">已确认</option>
						<option value="rejected">已驳回</option>
					</select>
				</div>
				<div class="flex items-end">
					<button
						onclick={handleSearch}
						class="w-full md:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
					>
						搜索
					</button>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								学生姓名
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								课程名称
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								课时数
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								状态
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								提交人
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								确认人
							</th>
							<th class="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
								提交时间
							</th>
							<th class="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
								操作
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#if data.consumptions.length === 0}
							<tr>
								<td colspan="8" class="px-6 py-12 text-center">
									<div class="text-gray-400">
										<div class="text-4xl mb-3">📋</div>
										<p class="text-gray-500">暂无课消记录</p>
									</div>
								</td>
							</tr>
						{:else}
							{#each data.consumptions as consumption (consumption.id)}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium text-sm">
												{consumption.studentName?.charAt(0) || '?'}
											</div>
											<span class="ml-3 font-medium text-gray-900">
												{consumption.studentName || '-'}
											</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-gray-700">
										{consumption.courseName}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="font-semibold text-teal-700">{consumption.hours}</span>
										<span class="text-gray-500 text-sm ml-1">课时</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<StatusBadge status={consumption.status} type="consumption" />
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
										{consumption.consultantName}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
										{consumption.teacherName || '-'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
										{formatDate(consumption.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<div class="flex items-center justify-end gap-2">
											<a
												href={`/consumption/${consumption.id}`}
												class="inline-flex items-center px-2.5 py-1.5 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
											>
												<Eye size={14} class="mr-1" />
												详情
											</a>
											{#if canConfirm(data.user.role) && consumption.status === 'pending'}
												<a
													href={`/consumption/${consumption.id}`}
													class="inline-flex items-center px-2.5 py-1.5 text-sm text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
												>
													<Check size={14} class="mr-1" />
													确认
												</a>
												<a
													href={`/consumption/${consumption.id}`}
													class="inline-flex items-center px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
												>
													<X size={14} class="mr-1" />
													驳回
												</a>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
