<script lang="ts">
	import { Plus, ArrowLeft } from '@lucide/svelte';
	import Layout from '$lib/components/Layout.svelte';
	import type { Student, User } from '$lib/types';

	let { data } = $props<{
		data: {
			user: User;
			students: Student[];
			preselectedStudentId: string;
		};
	}>();

	let formState = $state({
		studentId: data.preselectedStudentId || '',
		originalCourseDate: '',
		originalCourseName: '',
		reason: ''
	});

	let submitting = $state(false);
</script>

<Layout user={data.user}>
	<div class="space-y-6">
		<div class="flex items-center gap-4">
			<a
				href="/makeup"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
			>
				<ArrowLeft size={18} />
				返回
			</a>
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-teal-100 p-2">
					<Plus class="h-6 w-6 text-teal-700" />
				</div>
				<div>
					<h1 class="text-xl font-bold text-gray-800">新增补课申请</h1>
					<p class="text-sm text-gray-500">填写学生补课申请信息</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<form method="POST" class="space-y-6">
				<div class="grid gap-6 md:grid-cols-2">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">
							学生 <span class="text-red-500">*</span>
						</label>
						<select
							name="studentId"
							bind:value={formState.studentId}
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
						>
							<option value="" disabled>请选择学生</option>
							{#each data.students as student}
								<option value={student.id}>{student.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">
							原课程日期 <span class="text-red-500">*</span>
						</label>
						<input
							type="date"
							name="originalCourseDate"
							bind:value={formState.originalCourseDate}
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
						/>
					</div>

					<div class="md:col-span-2">
						<label class="mb-1 block text-sm font-medium text-gray-700">
							原课程名称 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="originalCourseName"
							bind:value={formState.originalCourseName}
							placeholder="请输入原课程名称"
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
						/>
					</div>

					<div class="md:col-span-2">
						<label class="mb-1 block text-sm font-medium text-gray-700">请假原因</label>
						<textarea
							name="reason"
							bind:value={formState.reason}
							rows={4}
							placeholder="请输入请假原因（选填）"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
						></textarea>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
					<a
						href="/makeup"
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					>
						取消
					</a>
					<button
						type="submit"
						disabled={submitting}
						class="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Plus size={18} />
						提交申请
					</button>
				</div>
			</form>
		</div>
	</div>
</Layout>
