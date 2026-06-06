<script lang="ts">
	import { Check, Clock } from '@lucide/svelte';

	export interface TimelineStep {
		title: string;
		time?: string;
		operator?: string;
		active: boolean;
		completed: boolean;
	}

	let { steps }: { steps: TimelineStep[] } = $props();
</script>

<div class="relative">
	{#each steps as step, index}
		<div class="flex items-start">
			{#if index < steps.length - 1}
				<div
					class="absolute left-4 top-10 h-full w-0.5 {step.completed
						? 'bg-teal-500'
						: 'bg-gray-200'}"
				></div>
			{/if}

			<div
				class="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 {step.active
					? 'border-teal-600 bg-teal-600'
					: step.completed
						? 'border-teal-500 bg-teal-500'
						: 'border-gray-300 bg-white'}"
			>
				{#if step.completed}
					<Check size={16} class="text-white" />
				{:else if step.active}
					<Clock size={14} class="text-white" />
				{:else}
					<span class="text-xs font-medium text-gray-400">{index + 1}</span>
				{/if}
			</div>

			<div class="ml-4 flex-1 pb-8">
				<div
					class="text-sm font-semibold {step.active
						? 'text-teal-700'
						: step.completed
							? 'text-gray-800'
							: 'text-gray-400'}"
				>
					{step.title}
				</div>
				{#if step.time}
					<div class="mt-1 text-xs text-gray-500">{step.time}</div>
				{/if}
				{#if step.operator}
					<div class="mt-0.5 text-xs text-gray-400">操作人：{step.operator}</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
