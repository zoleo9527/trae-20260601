<script lang="ts">
	import { FileText, Plus, Eye, CalendarCheck, CheckCircle, XCircle } from '@lucide/svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate } from '$lib/utils/format';
	import type { MakeupRecord, User, MakeupStatus } from '$lib/types';
	import { goto } from '$app/navigation';

	let { data } = $props<{
		data: {
			user: User;
			makeups: MakeupRecord[];
			selectedStatus: string | null;
		};
	}>();

	const statusOptions: { value: MakeupStatus | 'all'; label: string }[] = [
		{ value: 'all', label: '全部状态' },
		{ value: 'pending', label: '待安排' },
		{ value: 'scheduled', label: '待上课' },
		{ value: 'completed', label: '已完成' },
		{ value: 'cancelled', label: '已取消' }
	];

	let currentStatus = $derived(data.selectedStatus || 'all');

	async function handleStatusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const value = target.value;
		if (value === 'all') {
			await goto('/makeup');
		} else {
			await goto(`/makeup?status=${value}`);
		}
	}

	function canCreate(): boolean {
		return data.user.role === 'consultant' || data.user.role === 'admin';
	}

	function canSchedule(makeup: MakeupRecord): boolean {
		return (
			makeup.status === 'pending' && (data.user.role === 'teacher' || data.user.role === 'admin')
		);
	}

	function canComplete(makeup: MakeupRecord): boolean {
		return makeup.status === 'scheduled' && (data.user.role === 'teacher' || data.user.role === 'admin');
	}

	function canCancel(makeup: MakeupRecord): boolean {
		if (data.user.role === 'admin') {
			return true;
		}
		if (data.user.role === 'consultant' && makeup.status === 'pending' && makeup.consultantId === data.user.id) {
			return true;
		}
		return false;
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-teal-100 p-2">
				<FileText class="h-6 w-6 text-teal-700" />
			</div>
			<div>
				<h1 class="text-xl font-bold text-gray-800">补课安排</h1>
				<p class="text-sm text-gray-500">管理学生补课申请和安排</p>
			</div>
		</div>

		{#if canCreate()}
			<a
				href="/makeup/new"
				class="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
			>
				<Plus size={18} />
				新增补课申请
			</a>
		{/if}
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<div class="sm:w-64">
				<label class="mb-1 block text-sm font-medium text-gray-700">状态筛选</label>
				<select
					value={currentStatus}
					onchange={handleStatusChange}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
				>
					{#each statusOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							学生姓名
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							原课程日期
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							原课程名称
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							状态
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							申请时间
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							安排时间
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							操作
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if data.makeups.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center">
								<div class="flex flex-col items-center">
									<FileText class="mb-3 h-12 w-12 text-gray-300" />
									<p class="text-gray-500">暂无补课记录</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each data.makeups as makeup}
							<tr class="hover:bg-gray-50">
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm font-medium text-gray-900">
										{makeup.studentName || '-'}
									</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm text-gray-600">{makeup.originalCourseDate}</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm text-gray-600">{makeup.originalCourseName}</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<StatusBadge status={makeup.status} type="makeup" />
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm text-gray-600">{formatDate(makeup.createdAt)}</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm text-gray-600">
										{makeup.scheduledDate ? formatDate(makeup.scheduledDate) : '-'}
									</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-right text-sm">
									<div class="flex items-center justify-end gap-2">
										<a
											href={`/makeup/${makeup.id}`}
											class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
										>
											<Eye size={14} />
											查看详情
										</a>
										{#if canSchedule(makeup)}
											<a
												href={`/makeup/${makeup.id}`}
												class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
											>
												<CalendarCheck size={14} />
												安排
											</a>
										{/if}
										{#if canComplete(makeup)}
											<a
												href={`/makeup/${makeup.id}`}
												class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
											>
												<CheckCircle size={14} />
												完成
											</a>
										{/if}
										{#if canCancel(makeup)}
											<a
												href={`/makeup/${makeup.id}`}
												class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
											>
												<XCircle size={14} />
												取消
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
