<script lang="ts">
	import { ArrowLeft, Save, X } from '@lucide/svelte';
	import type { PageData } from './$types';
	import type { ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();

	let studentId = $state((form as any)?.studentId || data.preselectedStudentId || '');
	let courseName = $state((form as any)?.courseName || '');
	let hours = $state((form as any)?.hours || '');
	let remark = $state((form as any)?.remark || '');
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<a
			href="/consumption"
			class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
		>
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">新增课消</h1>
			<p class="text-gray-500 mt-1">创建新的课包消耗记录</p>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
		<div>
			<label for="studentId" class="block text-sm font-medium text-gray-700 mb-2">
				选择学生 <span class="text-red-500">*</span>
			</label>
			<select
				id="studentId"
				name="studentId"
				bind:value={studentId}
				class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
				required
			>
				<option value="">请选择学生</option>
				{#each data.students as student (student.id)}
					<option value={student.id}>
						{student.name} (剩余 {student.remainingHours} 课时)
					</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="courseName" class="block text-sm font-medium text-gray-700 mb-2">
				课程名称 <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="courseName"
				name="courseName"
				bind:value={courseName}
				placeholder="例如：钢琴一对一"
				class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
				required
			/>
		</div>

		<div>
			<label for="hours" class="block text-sm font-medium text-gray-700 mb-2">
				课时数 <span class="text-red-500">*</span>
			</label>
			<input
				type="number"
				id="hours"
				name="hours"
				bind:value={hours}
				min="0.5"
				step="0.5"
				placeholder="例如：1"
				class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
				required
			/>
		</div>

		<div>
			<label for="remark" class="block text-sm font-medium text-gray-700 mb-2">
				备注
			</label>
			<textarea
				id="remark"
				name="remark"
				bind:value={remark}
				rows="3"
				placeholder="可选：添加备注信息"
				class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
			/>
		</div>

		<div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
			<a
				href="/consumption"
				class="inline-flex items-center px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
			>
				<X size={16} class="mr-2" />
				取消
			</a>
			<button
				type="submit"
				class="inline-flex items-center px-5 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium shadow-sm"
			>
				<Save size={16} class="mr-2" />
				提交
			</button>
		</div>
	</form>
</div>
