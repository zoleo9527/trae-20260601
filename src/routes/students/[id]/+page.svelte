<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import {
		ArrowLeft,
		Phone,
		Clock,
		Plus,
		CalendarClock,
		BookOpen,
		User as UserIcon,
		CalendarDays
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { Student, ConsumptionRecord, MakeupRecord, User } from '$lib/types';
	import { formatDate } from '$lib/utils/format';

	let { data } = $props<{
		data: {
			user: User;
			student: Student;
			consumptionHistory: ConsumptionRecord[];
			makeupHistory: MakeupRecord[];
		};
	}>();

	let activeTab = $state<'consumption' | 'makeup'>('consumption');

	function canManage(): boolean {
		return data.user.role === 'consultant' || data.user.role === 'admin';
	}
</script>

<div class="space-y-6">
	<a
		href="/students"
		class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-teal-700 transition-colors"
	>
		<ArrowLeft size={16} />
		返回学生列表
	</a>

	<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
		<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
			<div class="flex items-center gap-5">
				<div class="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
					<span class="text-teal-700 font-bold text-3xl">
						{data.student.name.charAt(0)}
					</span>
				</div>
				<div>
					<h2 class="text-2xl font-bold text-gray-800 mb-2">{data.student.name}</h2>
					<div class="flex items-center gap-4 text-sm text-gray-500">
						<div class="flex items-center gap-1.5">
							<Phone size={16} />
							<span>{data.student.phone || '未填写联系电话'}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex-1 max-w-md">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">课时进度</span>
					<span class="text-sm text-gray-500">
						总课时 {data.student.packageHours} | 已消耗 {data.student.packageHours -
						data.student.remainingHours}
					</span>
				</div>
				<ProgressBar
					value={data.student.remainingHours}
					max={data.student.packageHours}
				/>
			</div>
		</div>

		{#if canManage()}
			<div class="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
				<a
					href={`/consumption/new?studentId=${data.student.id}`}
					class="flex items-center gap-2 px-4 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm"
				>
					<Plus size={16} />
					新增课消
				</a>
				<a
					href={`/makeup/new?studentId=${data.student.id}`}
					class="flex items-center gap-2 px-4 py-2.5 border border-teal-700 text-teal-700 bg-white rounded-lg hover:bg-teal-50 transition-colors font-medium text-sm"
				>
					<CalendarClock size={16} />
					申请补课
				</a>
			</div>
		{/if}
	</div>

	<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
		<div class="border-b border-gray-200">
			<nav class="flex">
				<button
					onclick={() => (activeTab = 'consumption')}
					class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors {activeTab
						=== 'consumption'
						? 'border-teal-700 text-teal-700'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					<BookOpen size={16} />
					课消历史
					<span
						class="ml-1.5 px-2 py-0.5 text-xs rounded-full {activeTab === 'consumption'
							? 'bg-teal-100 text-teal-700'
							: 'bg-gray-100 text-gray-600'}"
					>
						{data.consumptionHistory.length}
					</span>
				</button>
				<button
					onclick={() => (activeTab = 'makeup')}
					class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors {activeTab
						=== 'makeup'
						? 'border-teal-700 text-teal-700'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					<CalendarDays size={16} />
					补课历史
					<span
						class="ml-1.5 px-2 py-0.5 text-xs rounded-full {activeTab === 'makeup'
							? 'bg-teal-100 text-teal-700'
							: 'bg-gray-100 text-gray-600'}"
					>
						{data.makeupHistory.length}
					</span>
				</button>
			</nav>
		</div>

		<div class="p-6">
			{#if activeTab === 'consumption'}
				{#if data.consumptionHistory.length === 0}
					<div class="text-center py-12">
						<BookOpen size={48} class="mx-auto text-gray-300 mb-4" />
						<p class="text-gray-500">暂无课消记录</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										课程名称
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										消耗课时
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										顾问
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										状态
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										日期
									</th>
								</tr>
							</thead>
							<tbody>
								{#each data.consumptionHistory as record (record.id)}
									<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
										<td class="py-3 px-4 text-sm text-gray-800">
											{record.courseName}
										</td>
										<td class="py-3 px-4 text-sm text-gray-600">
											{record.hours} 课时
										</td>
										<td class="py-3 px-4 text-sm text-gray-600">
											{record.consultantName}
										</td>
										<td class="py-3 px-4">
											<StatusBadge status={record.status} type="consumption" />
										</td>
										<td class="py-3 px-4 text-sm text-gray-500">
											{formatDate(record.createdAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else}
				{#if data.makeupHistory.length === 0}
					<div class="text-center py-12">
						<CalendarDays size={48} class="mx-auto text-gray-300 mb-4" />
						<p class="text-gray-500">暂无补课记录</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										原课程
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										原课程日期
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										补课日期
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										状态
									</th>
									<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">
										申请日期
									</th>
								</tr>
							</thead>
							<tbody>
								{#each data.makeupHistory as record (record.id)}
									<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
										<td class="py-3 px-4 text-sm text-gray-800">
											{record.originalCourseName}
										</td>
										<td class="py-3 px-4 text-sm text-gray-600">
											{formatDate(record.originalCourseDate)}
										</td>
										<td class="py-3 px-4 text-sm text-gray-600">
											{record.scheduledDate
												? formatDate(record.scheduledDate)
												: '待安排'}
										</td>
										<td class="py-3 px-4">
											<StatusBadge status={record.status} type="makeup" />
										</td>
										<td class="py-3 px-4 text-sm text-gray-500">
											{formatDate(record.createdAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
