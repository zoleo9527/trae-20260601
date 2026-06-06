<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StatCard from '$lib/components/StatCard.svelte';
	import {
		Users,
		Clock,
		CalendarClock,
		TrendingUp,
		AlertTriangle,
		AlertCircle,
		CheckCircle,
		ChevronRight,
		ListTodo,
		Activity,
		History,
		ArrowRight
	} from '@lucide/svelte';
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const dashboardData = $derived(data.dashboardData);

	const priorityColors: Record<string, string> = {
		high: 'bg-rose-100 text-rose-700',
		medium: 'bg-amber-100 text-amber-700',
		low: 'bg-teal-100 text-teal-700'
	};

	const priorityLabels: Record<string, string> = {
		high: '高优先级',
		medium: '中优先级',
		low: '低优先级'
	};

	const actionLabels: Record<string, string> = {
		create: '创建',
		update: '更新',
		delete: '删除',
		confirm: '确认',
		reject: '拒绝',
		schedule: '安排',
		complete: '完成',
		cancel: '取消'
	};

	function handleTodoClick(todo: { type: string; relatedId?: string }) {
		if (todo.type === 'consumption' && todo.relatedId) {
			goto(`/consumption/${todo.relatedId}`);
		} else if (todo.type === 'consumption') {
			goto('/consumption');
		} else if (todo.type === 'makeup' && todo.relatedId) {
			goto(`/makeup/${todo.relatedId}`);
		} else if (todo.type === 'makeup') {
			goto('/makeup');
		}
	}

	function getRiskBorderClass(level: string): string {
		if (level === 'high') return 'border-l-4 border-rose-500';
		if (level === 'medium') return 'border-l-4 border-amber-500';
		return 'border-l-4 border-teal-500';
	}



	function getRiskIconColor(level: string): string {
		if (level === 'high') return 'text-rose-500';
		if (level === 'medium') return 'text-amber-500';
		return 'text-teal-500';
	}
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<StatCard
			icon={Users}
			title="学生总数"
			value={dashboardData.stats.totalStudents}
			color="teal"
		/>
		<StatCard
			icon={Clock}
			title="待确认课消"
			value={dashboardData.stats.pendingConsumptions}
			color="amber"
		/>
		<StatCard
			icon={CalendarClock}
			title="待处理补课"
			value={dashboardData.stats.pendingMakeups}
			color="blue"
		/>
		<StatCard
			icon={TrendingUp}
			title="今日课消"
			value={dashboardData.stats.totalHoursConsumed.toFixed(1)}
			color="rose"
		/>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
						<ListTodo size={18} class="text-teal-700" />
					</div>
					<h3 class="text-lg font-semibold text-gray-800">待办事项</h3>
				</div>
				<button
					onclick={() => goto('/consumption')}
					class="flex items-center text-sm text-teal-700 hover:text-teal-800 transition-colors"
				>
					查看全部
					<ChevronRight size={16} />
				</button>
			</div>

			<div class="space-y-3">
				{#if dashboardData.todos.length === 0}
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<CheckCircle size={40} class="mx-auto text-teal-300" />
						<p class="mt-3 text-gray-500">暂无待办事项</p>
					</div>
				{:else}
					{#each dashboardData.todos as todo (todo.id)}
						<div
							onclick={() => handleTodoClick(todo)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && handleTodoClick(todo)}
							class="group cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-gray-800 group-hover:text-teal-700 transition-colors">
										{todo.title}
									</h4>
									{#if todo.description}
										<p class="mt-1 text-sm text-gray-500 line-clamp-2">
											{todo.description}
										</p>
									{/if}
								</div>
								<span
									class="ml-3 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium {priorityColors[todo.priority]}"
								>
									{priorityLabels[todo.priority]}
								</span>
							</div>
							<div class="mt-3 flex items-center justify-between">
								<span class="text-xs text-gray-400">
									{formatDate(todo.createdAt)}
								</span>
								<ArrowRight
									size={16}
									class="text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-teal-500"
								/>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
					<Activity size={18} class="text-amber-700" />
				</div>
				<h3 class="text-lg font-semibold text-gray-800">风险预警</h3>
			</div>

			<div class="space-y-3">
				{#if dashboardData.risks.length === 0}
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<CheckCircle size={40} class="mx-auto text-teal-300" />
						<p class="mt-3 text-gray-500">暂无风险预警</p>
					</div>
				{:else}
					{#each dashboardData.risks as risk (risk.id)}
						<div
							class="rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md {getRiskBorderClass(risk.level)}"
						>
							<div class="flex items-start gap-3">
								<div class="flex-shrink-0">
									{#if risk.level === 'high'}
										<AlertCircle size={20} class={getRiskIconColor(risk.level)} />
									{:else}
										<AlertTriangle size={20} class={getRiskIconColor(risk.level)} />
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-gray-800">
										{risk.studentName}
									</h4>
									<p class="mt-1 text-sm text-gray-500">
										{risk.description}
									</p>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
					<History size={18} class="text-blue-700" />
				</div>
				<h3 class="text-lg font-semibold text-gray-800">最近变更</h3>
			</div>

			<div class="space-y-3">
				{#if dashboardData.recentChanges.length === 0}
					<div class="rounded-xl bg-white p-8 text-center shadow-sm">
						<History size={40} class="mx-auto text-gray-300" />
						<p class="mt-3 text-gray-500">暂无变更记录</p>
					</div>
				{:else}
					{#each dashboardData.recentChanges as change (change.id)}
						<div class="rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
							<div class="flex items-start gap-3">
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100"
								>
									<Activity size={16} class="text-gray-500" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
											{actionLabels[change.action] || change.action}
										</span>
										<span class="text-xs text-gray-400">
											{change.entityType}
										</span>
									</div>
									{#if change.detail}
										<p class="mt-1 text-sm text-gray-600 line-clamp-2">
											{change.detail}
										</p>
									{/if}
									<div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
										<span>{change.userName}</span>
										<span>·</span>
										<span>{formatDate(change.createdAt)}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
