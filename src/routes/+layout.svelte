<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getStore } from '$lib/store.svelte';
	import { ROLE_LABELS } from '$lib/types';
	import type { UserRole } from '$lib/types';
	import { Train, ClipboardList, Users } from 'lucide-svelte';

	const store = getStore();

	const roles: UserRole[] = ['freight_clerk', 'loading_leader', 'customer_service', 'station_manager'];

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<header class="bg-rail-blue text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<Train size={28} />
				<div>
					<h1 class="text-lg font-bold leading-tight">铁路货运站 · 货损登记与赔付管理</h1>
					<p class="text-xs text-rail-blue-light opacity-80">责任链追踪 · 赔付材料闭环</p>
				</div>
			</div>
			<nav class="flex items-center gap-4 text-sm">
				<a href="/" class="hover:text-safety-orange-light transition-colors flex items-center gap-1">
					<ClipboardList size={16} />
					工作台
				</a>
				<a href="/damage" class="hover:text-safety-orange-light transition-colors">货损列表</a>
			</nav>
		</div>
	</header>

	<div class="bg-iron-100 border-b border-iron-200">
		<div class="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
			<Users size={16} class="text-iron-500" />
			<span class="text-xs text-iron-500 mr-1">角色视图：</span>
			{#each roles as role}
				<button
					onclick={() => store.currentRole = role}
					class="px-3 py-1 rounded-full text-xs font-medium transition-all {store.currentRole === role
						? 'bg-rail-blue text-white shadow-sm'
						: 'bg-white text-iron-600 hover:bg-iron-200 border border-iron-300'}"
				>
					{ROLE_LABELS[role]}
				</button>
			{/each}
		</div>
	</div>

	<main class="flex-1">
		{@render children()}
	</main>
</div>
