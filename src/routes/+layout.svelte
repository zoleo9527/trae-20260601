<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores';
	import { ROLE_LABELS } from '$lib/types';
	import type { User } from '$lib/types';

	let users: User[] = [];
	let showUserSelector = false;

	onMount(async () => {
		const res = await fetch('/api/users');
		users = await res.json();
	});

	function selectUser(user: User) {
		currentUser.login(user);
		showUserSelector = false;
	}

	function logout() {
		currentUser.logout();
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-xl font-bold text-gray-900">📷 摄影器材租赁管理系统</h1>
					</div>
					<nav class="ml-10 flex space-x-4">
						<a href="/" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
							租赁单列表
						</a>
					</nav>
				</div>
				<div class="relative">
					{#if $currentUser}
						<button
							on:click={() => (showUserSelector = !showUserSelector)}
							class="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
						>
							<span class="text-sm font-medium">{$currentUser.name}</span>
							<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
								{ROLE_LABELS[$currentUser.role]}
							</span>
						</button>
					{:else}
						<button
							on:click={() => (showUserSelector = !showUserSelector)}
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
						>
							选择角色登录
						</button>
					{/if}

					{#if showUserSelector}
						<div class="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-50">
							<div class="p-3 border-b">
								<p class="text-sm text-gray-600">切换用户角色（演示用）</p>
							</div>
							<div class="py-1">
								{#each users as user}
									<button
										on:click={() => selectUser(user)}
										class="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center"
										class:active={$currentUser?.id === user.id}
									>
										<span class="font-medium">{user.name}</span>
										<span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
											{ROLE_LABELS[user.role]}
										</span>
									</button>
								{/each}
							</div>
							{#if $currentUser}
								<div class="p-3 border-t">
									<button on:click={logout} class="w-full text-left text-sm text-red-600 hover:text-red-800">
										退出登录
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
</div>

<style>
	.active {
		background-color: #eff6ff;
	}
</style>
