<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate } from '$lib/utils/format';
	import { ArrowLeft, Check, X, Clock, User, FileText, AlertCircle } from '@lucide/svelte';
	import type { PageData } from './$types';
	import type { ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();

	let showRejectModal = $state(false);
	let rejectReason = $state('');

	function canConfirm(userRole: string): boolean {
		return ['teacher', 'admin'].includes(userRole);
	}

	function openRejectModal() {
		showRejectModal = true;
		rejectReason = '';
	}

	function closeRejectModal() {
		showRejectModal = false;
		rejectReason = '';
	}

	function getTimelineItems() {
		const items = [];

		items.push({
			status: 'submitted',
			title: '提交记录',
			description: `由 ${data.consumption.consultantName} 提交`,
			time: data.consumption.createdAt,
			active: true,
			color: 'bg-teal-500'
		});

		if (data.consumption.status === 'confirmed' && data.consumption.confirmedAt) {
			items.push({
				status: 'confirmed',
				title: '确认通过',
				description: `由 ${data.consumption.teacherName} 确认`,
				time: data.consumption.confirmedAt,
				active: true,
				color: 'bg-teal-500'
			});
		} else if (data.consumption.status === 'rejected') {
			items.push({
				status: 'rejected',
				title: '已驳回',
				description: `由 ${data.consumption.teacherName} 驳回`,
				time: data.consumption.createdAt,
				active: true,
				color: 'bg-red-500'
			});
		} else {
			items.push({
				status: 'pending',
				title: '待确认',
				description: '等待任课老师确认',
				time: null,
				active: false,
				color: 'bg-gray-300'
			});
		}

		return items;
	}
</script>

<Layout user={data.user}>
	<div class="max-w-3xl mx-auto space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a
					href="/consumption"
					class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
				>
					<ArrowLeft size={20} />
				</a>
				<div>
					<h1 class="text-2xl font-bold text-gray-800">课消详情</h1>
					<p class="text-gray-500 mt-1">查看课包消耗记录详情</p>
				</div>
			</div>
			<StatusBadge status={data.consumption.status} type="consumption" />
		</div>

		{#if form?.error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{form.error}
			</div>
		{/if}

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
			<div class="p-6 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
					<FileText size={18} class="text-teal-600" />
					基本信息
				</h2>
			</div>
			<div class="p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">学生姓名</label>
						<div class="flex items-center gap-2">
							<div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium text-sm">
								{data.consumption.studentName?.charAt(0) || '?'}
							</div>
							<span class="font-medium text-gray-900">
								{data.consumption.studentName || '-'}
							</span>
						</div>
					</div>
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">课程名称</label>
						<p class="font-medium text-gray-900">{data.consumption.courseName}</p>
					</div>
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">消耗课时</label>
						<p class="font-semibold text-teal-700 text-lg">
							{data.consumption.hours} <span class="text-sm font-normal text-gray-500">课时</span>
						</p>
					</div>
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">提交时间</label>
						<p class="font-medium text-gray-900">{formatDate(data.consumption.createdAt)}</p>
					</div>
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">提交人（课程顾问）</label>
						<div class="flex items-center gap-2">
							<User size={16} class="text-gray-400" />
							<span class="font-medium text-gray-900">{data.consumption.consultantName}</span>
						</div>
					</div>
					<div>
						<label class="text-sm text-gray-500 block mb-1.5">确认人（任课老师）</label>
						<div class="flex items-center gap-2">
							<User size={16} class="text-gray-400" />
							<span class="font-medium text-gray-900">
								{data.consumption.teacherName || '-'}
							</span>
						</div>
					</div>
				</div>

				{#if data.consumption.remark}
					<div class="mt-6 pt-6 border-t border-gray-100">
						<label class="text-sm text-gray-500 block mb-1.5">备注</label>
						<p class="text-gray-700 bg-gray-50 p-4 rounded-lg">{data.consumption.remark}</p>
					</div>
				{/if}

				{#if data.consumption.rejectReason}
					<div class="mt-6 pt-6 border-t border-gray-100">
						<label class="text-sm text-gray-500 block mb-1.5 flex items-center gap-1">
							<AlertCircle size={14} class="text-red-500" />
							驳回原因
						</label>
						<p class="text-red-700 bg-red-50 p-4 rounded-lg border border-red-100">
							{data.consumption.rejectReason}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
			<div class="p-6 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
					<Clock size={18} class="text-teal-600" />
					状态流转
				</h2>
			</div>
			<div class="p-6">
				<div class="relative">
					{#each getTimelineItems() as item, index (item.status)}
						<div class="flex gap-4">
							<div class="flex flex-col items-center">
								<div
									class="w-4 h-4 rounded-full {item.color} flex-shrink-0 ring-4 ring-white shadow-sm"
								/>
								{#if index < getTimelineItems().length - 1}
									<div
										class="w-0.5 flex-1 mt-1 {index < getTimelineItems().length - 1
											? item.active
												? 'bg-teal-200'
												: 'bg-gray-200'
											: ''}"
										style="min-height: 3rem;"
									/>
								{/if}
							</div>
							<div class="pb-6 flex-1">
								<div class="flex items-center justify-between">
									<h3
										class="font-medium {item.active
											? 'text-gray-900'
											: 'text-gray-400'}"
									>
										{item.title}
									</h3>
									{#if item.time}
										<span class="text-sm text-gray-500">{formatDate(item.time)}</span>
									{/if}
								</div>
								<p
									class="text-sm mt-1 {item.active
										? 'text-gray-600'
										: 'text-gray-400'}"
								>
									{item.description}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		{#if canConfirm(data.user.role) && data.consumption.status === 'pending'}
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h3 class="font-semibold text-gray-800">审核操作</h3>
						<p class="text-sm text-gray-500 mt-1">请确认该课消记录是否有效</p>
					</div>
					<div class="flex gap-3">
						<button
							onclick={openRejectModal}
							class="inline-flex items-center px-5 py-2.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
						>
							<X size={16} class="mr-2" />
							驳回
						</button>
						<form method="POST" action="?/confirm">
							<button
								type="submit"
								class="inline-flex items-center px-5 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium shadow-sm"
							>
								<Check size={16} class="mr-2" />
								确认通过
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if showRejectModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				class="fixed inset-0 bg-black/50"
				onclick={closeRejectModal}
			/>
			<div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">驳节课消记录</h3>
				<form method="POST" action="?/reject">
					<div class="mb-6">
						<label for="rejectReason" class="block text-sm font-medium text-gray-700 mb-2">
							驳回原因 <span class="text-red-500">*</span>
						</label>
						<textarea
							id="rejectReason"
							name="reason"
							bind:value={rejectReason}
							rows="4"
							placeholder="请输入驳回原因..."
							class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
							required
						/>
					</div>
					<div class="flex justify-end gap-3">
						<button
							type="button"
							onclick={closeRejectModal}
							class="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
						>
							取消
						</button>
						<button
							type="submit"
							class="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
						>
							确认驳回
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</Layout>
