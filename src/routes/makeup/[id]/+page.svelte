<script lang="ts">
	import { ArrowLeft, CalendarCheck, CheckCircle, XCircle, FileText, User as UserIcon, Calendar, MapPin } from '@lucide/svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Timeline, { type TimelineStep } from '$lib/components/Timeline.svelte';
	import { formatDate } from '$lib/utils/format';
	import type { MakeupRecord, User } from '$lib/types';

	let { data } = $props<{
		data: {
			user: User;
			makeup: MakeupRecord;
		};
	}>();

	let showScheduleForm = $state(false);
	let showCompleteForm = $state(false);
	let showCancelForm = $state(false);

	let scheduleForm = $state({
		scheduledDate: '',
		classroom: ''
	});

	let completeForm = $state({
		makeupContent: ''
	});

	let cancelForm = $state({
		cancelReason: ''
	});

	let makeup = $derived(data.makeup);
	let user = $derived(data.user);

	let timelineSteps = $derived(
		(() => {
			const steps: TimelineStep[] = [
				{
					title: '提交申请',
					time: makeup.createdAt ? formatDate(makeup.createdAt) : undefined,
					operator: makeup.consultantName,
					completed: true,
					active: false
				},
				{
					title: '安排补课',
					time: makeup.scheduledAt ? formatDate(makeup.scheduledAt) : undefined,
					operator: makeup.teacherName,
					completed: makeup.status !== 'pending',
					active: makeup.status === 'pending'
				},
				{
					title: '补课完成',
					time: makeup.completedAt ? formatDate(makeup.completedAt) : undefined,
					operator: makeup.teacherName,
					completed: makeup.status === 'completed',
					active: makeup.status === 'scheduled'
				}
			];

			if (makeup.status === 'cancelled') {
				steps.push({
					title: '已取消',
					time: makeup.cancelledAt ? formatDate(makeup.cancelledAt) : undefined,
					completed: true,
					active: false
				});
			}

			return steps;
		})()
	);

	function canSchedule(): boolean {
		return makeup.status === 'pending' && (user.role === 'teacher' || user.role === 'admin');
	}

	function canComplete(): boolean {
		return makeup.status === 'scheduled' && (user.role === 'teacher' || user.role === 'admin');
	}

	function canCancel(): boolean {
		if (user.role === 'admin') {
			return true;
		}
		if (user.role === 'consultant' && (makeup.status === 'pending' || makeup.status === 'scheduled') && makeup.consultantId === user.id) {
			return true;
		}
		return false;
	}
</script>

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
				<FileText class="h-6 w-6 text-teal-700" />
			</div>
			<div>
				<h1 class="text-xl font-bold text-gray-800">补课详情</h1>
				<p class="text-sm text-gray-500">查看和管理补课申请</p>
			</div>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-2">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-800">基本信息</h2>
					<StatusBadge status={makeup.status} type="makeup" />
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-gray-100 p-2">
							<UserIcon size={18} class="text-gray-600" />
						</div>
						<div>
							<p class="text-xs text-gray-500">学生姓名</p>
							<p class="text-sm font-medium text-gray-800">{makeup.studentName || '-'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-gray-100 p-2">
							<Calendar size={18} class="text-gray-600" />
						</div>
						<div>
							<p class="text-xs text-gray-500">原课程日期</p>
							<p class="text-sm font-medium text-gray-800">{makeup.originalCourseDate}</p>
						</div>
					</div>

					<div class="flex items-start gap-3 md:col-span-2">
						<div class="rounded-lg bg-gray-100 p-2">
							<FileText size={18} class="text-gray-600" />
						</div>
						<div>
							<p class="text-xs text-gray-500">原课程名称</p>
							<p class="text-sm font-medium text-gray-800">{makeup.originalCourseName}</p>
						</div>
					</div>

					{#if makeup.reason}
						<div class="flex items-start gap-3 md:col-span-2">
							<div class="rounded-lg bg-gray-100 p-2">
								<FileText size={18} class="text-gray-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">请假原因</p>
								<p class="text-sm font-medium text-gray-800">{makeup.reason}</p>
							</div>
						</div>
					{/if}

					{#if makeup.scheduledDate}
						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-teal-100 p-2">
								<Calendar size={18} class="text-teal-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">补课时间</p>
								<p class="text-sm font-medium text-gray-800">{formatDate(makeup.scheduledDate)}</p>
							</div>
						</div>
					{/if}

					{#if makeup.classroom}
						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-teal-100 p-2">
								<MapPin size={18} class="text-teal-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">补课教室</p>
								<p class="text-sm font-medium text-gray-800">{makeup.classroom}</p>
							</div>
						</div>
					{/if}

					{#if makeup.teacherName}
						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-teal-100 p-2">
								<UserIcon size={18} class="text-teal-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">任课老师</p>
								<p class="text-sm font-medium text-gray-800">{makeup.teacherName}</p>
							</div>
						</div>
					{/if}

					{#if makeup.makeupContent}
						<div class="flex items-start gap-3 md:col-span-2">
							<div class="rounded-lg bg-green-100 p-2">
								<FileText size={18} class="text-green-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">补课内容</p>
								<p class="text-sm font-medium text-gray-800">{makeup.makeupContent}</p>
							</div>
						</div>
					{/if}

					{#if makeup.cancelReason}
						<div class="flex items-start gap-3 md:col-span-2">
							<div class="rounded-lg bg-red-100 p-2">
								<XCircle size={18} class="text-red-600" />
							</div>
							<div>
								<p class="text-xs text-gray-500">取消原因</p>
								<p class="text-sm font-medium text-gray-800">{makeup.cancelReason}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			{#if canSchedule() && showScheduleForm}
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
					<h3 class="mb-4 text-lg font-semibold text-blue-800">安排补课</h3>
					<form method="POST" action="?/schedule" class="space-y-4">
						<div class="grid gap-4 md:grid-cols-2">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">
									补课时间 <span class="text-red-500">*</span>
								</label>
								<input
									type="datetime-local"
									name="scheduledDate"
									bind:value={scheduleForm.scheduledDate}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
								/>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">
									教室 <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="classroom"
									bind:value={scheduleForm.classroom}
									placeholder="请输入教室"
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
								/>
							</div>
						</div>
						<div class="flex items-center justify-end gap-3">
							<button
								type="button"
								onclick={() => (showScheduleForm = false)}
								class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								取消
							</button>
							<button
								type="submit"
								class="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
							>
								<CalendarCheck size={18} />
								确认安排
							</button>
						</div>
					</form>
				</div>
			{/if}

			{#if canComplete() && showCompleteForm}
				<div class="rounded-lg border border-green-200 bg-green-50 p-6">
					<h3 class="mb-4 text-lg font-semibold text-green-800">完成补课</h3>
					<form method="POST" action="?/complete" class="space-y-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">
								补课内容 <span class="text-red-500">*</span>
							</label>
							<textarea
								name="makeupContent"
								bind:value={completeForm.makeupContent}
								rows={4}
								placeholder="请输入补课内容"
								required
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
							></textarea>
						</div>
						<div class="flex items-center justify-end gap-3">
							<button
								type="button"
								onclick={() => (showCompleteForm = false)}
								class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								取消
							</button>
							<button
								type="submit"
								class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
							>
								<CheckCircle size={18} />
								确认完成
							</button>
						</div>
					</form>
				</div>
			{/if}

			{#if canCancel() && showCancelForm}
				<div class="rounded-lg border border-red-200 bg-red-50 p-6">
					<h3 class="mb-4 text-lg font-semibold text-red-800">取消补课</h3>
					<form method="POST" action="?/cancel" class="space-y-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700">
								取消原因 <span class="text-red-500">*</span>
							</label>
							<textarea
								name="cancelReason"
								bind:value={cancelForm.cancelReason}
								rows={4}
								placeholder="请输入取消原因"
								required
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
							></textarea>
						</div>
						<div class="flex items-center justify-end gap-3">
							<button
								type="button"
								onclick={() => (showCancelForm = false)}
								class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								取消
							</button>
							<button
								type="submit"
								class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
							>
								<XCircle size={18} />
								确认取消
							</button>
						</div>
					</form>
				</div>
			{/if}
		</div>

		<div class="space-y-6">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<h2 class="mb-6 text-lg font-semibold text-gray-800">状态流转</h2>
				<Timeline steps={timelineSteps} />
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-800">操作</h2>
				<div class="space-y-3">
					{#if canSchedule() && !showScheduleForm}
						<button
							onclick={() => {
								showScheduleForm = true;
								showCompleteForm = false;
								showCancelForm = false;
							}}
							class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							<CalendarCheck size={18} />
							安排补课
						</button>
					{/if}

					{#if canComplete() && !showCompleteForm}
						<button
							onclick={() => {
								showScheduleForm = false;
								showCompleteForm = true;
								showCancelForm = false;
							}}
							class="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
						>
							<CheckCircle size={18} />
							完成补课
						</button>
					{/if}

					{#if canCancel() && !showCancelForm}
						<button
							onclick={() => {
								showScheduleForm = false;
								showCompleteForm = false;
								showCancelForm = true;
							}}
							class="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
						>
							<XCircle size={18} />
							取消补课
						</button>
					{/if}

					{#if makeup.status === 'completed' || makeup.status === 'cancelled'}
						<div class="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
							该补课记录已结束
						</div>
					{/if}
				</div>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-800">申请信息</h2>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">申请顾问</span>
						<span class="font-medium text-gray-800">{makeup.consultantName}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">申请时间</span>
						<span class="font-medium text-gray-800">{formatDate(makeup.createdAt)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
