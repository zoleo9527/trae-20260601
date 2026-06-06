<script lang="ts">
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { Search, Phone, Clock, Eye, User as UserIcon } from '@lucide/svelte';
	import type { Student, User } from '$lib/types';

	let { data } = $props<{
		data: {
			user: User;
			students: Student[];
		};
	}>();

	let searchQuery = $state('');

	const filteredStudents = $derived(
		data.students.filter((student: Student) =>
			student.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function getWarningClass(remaining: number, total: number): string {
		if (total === 0) return '';
		const percentage = (remaining / total) * 100;
		if (percentage < 20) return 'border-red-300 bg-red-50';
		if (percentage < 50) return 'border-orange-300 bg-orange-50';
		return 'border-gray-200 bg-white';
	}

	function getWarningText(remaining: number, total: number): string | null {
		if (total === 0) return null;
		const percentage = (remaining / total) * 100;
		if (percentage < 20) return '课时严重不足';
		if (percentage < 50) return '课时不足';
		return null;
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">学生列表</h3>
			<p class="text-sm text-gray-500">共 {data.students.length} 名学生</p>
		</div>
		<div class="relative">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索学生姓名..."
				class="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
			/>
		</div>
	</div>

	{#if filteredStudents.length === 0}
		<div class="text-center py-16 bg-white rounded-xl border border-gray-200">
			<UserIcon size={48} class="mx-auto text-gray-300 mb-4" />
			<p class="text-gray-500">未找到匹配的学生</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredStudents as student (student.id)}
				<div
					class="rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md {getWarningClass(
						student.remainingHours,
						student.packageHours
					)}"
				>
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
								<span class="text-teal-700 font-semibold text-lg">
									{student.name.charAt(0)}
								</span>
							</div>
							<div>
								<h4 class="font-semibold text-gray-800">{student.name}</h4>
								<div class="flex items-center gap-1.5 text-sm text-gray-500">
									<Phone size={14} />
									<span>{student.phone || '未填写'}</span>
								</div>
							</div>
						</div>
						{#if getWarningText(student.remainingHours, student.packageHours)}
							<span
								class="px-2 py-1 text-xs font-medium rounded-full {student.remainingHours /
									student.packageHours <
								0.2
									? 'bg-red-100 text-red-700'
									: 'bg-orange-100 text-orange-700'}"
							>
								{getWarningText(student.remainingHours, student.packageHours)}
							</span>
						{/if}
					</div>

					<div class="mb-4">
						<ProgressBar value={student.remainingHours} max={student.packageHours} />
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1 text-sm text-gray-500">
							<Clock size={14} />
							<span>剩余 {student.remainingHours} 课时</span>
						</div>
						<a
							href={`/students/${student.id}`}
							class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
						>
							<Eye size={14} />
							查看详情
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
