<script lang="ts">
	import type { Component } from 'svelte';

	let {
		icon,
		title,
		value,
		color = 'teal'
	}: {
		icon: Component;
		title: string;
		value: number | string;
		color?: 'teal' | 'amber' | 'blue' | 'rose';
	} = $props();

	const colorGradients: Record<string, string> = {
		teal: 'from-teal-600 to-teal-700',
		amber: 'from-amber-500 to-amber-600',
		blue: 'from-blue-500 to-blue-600',
		rose: 'from-rose-500 to-rose-600'
	};

	const colorBgLight: Record<string, string> = {
		teal: 'bg-teal-50',
		amber: 'bg-amber-50',
		blue: 'bg-blue-50',
		rose: 'bg-rose-50'
	};

	const colorText: Record<string, string> = {
		teal: 'text-teal-700',
		amber: 'text-amber-600',
		blue: 'text-blue-600',
		rose: 'text-rose-600'
	};
</script>

<div
	class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
>
	<div
		class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r {colorGradients[color]}"
	></div>

	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm font-medium text-gray-500">{title}</p>
			<p
				class="mt-2 text-3xl font-bold text-gray-800 transition-transform duration-300 group-hover:scale-105"
			>
				{value}
			</p>
		</div>

		<div
			class="flex h-12 w-12 items-center justify-center rounded-xl {colorBgLight[color]} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
		>
			<svelte:component this={icon} size={24} class={colorText[color]} />
		</div>
	</div>

	<div
		class="absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-10 {colorBgLight[color]}"
	></div>
</div>
