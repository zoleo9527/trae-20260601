<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Home,
		Clock,
		CalendarClock,
		Users,
		LogOut,
		UserRound,
		Menu,
		X
	} from '@lucide/svelte';
	import type { User } from '$lib/types';

	let { user, children } = $props<{ user: User; children: () => void }>();

	let sidebarOpen = $state(false);

	const roleNames: Record<string, string> = {
		consultant: '课程顾问',
		teacher: '任课老师',
		admin: '校区主管'
	};

	const menuItems = [
		{ id: 'home', name: '首页', icon: Home, path: '/', roles: ['consultant', 'teacher', 'admin'] },
		{
			id: 'consumption',
			name: '课包消耗',
			icon: Clock,
			path: '/consumption',
			roles: ['consultant', 'teacher', 'admin']
		},
		{
			id: 'makeup',
			name: '补课安排',
			icon: CalendarClock,
			path: '/makeup',
			roles: ['consultant', 'teacher', 'admin']
		},
		{
			id: 'students',
			name: '学生档案',
			icon: Users,
			path: '/students',
			roles: ['consultant', 'teacher', 'admin']
		}
	];

	const filteredMenuItems = $derived(menuItems.filter((item) => item.roles.includes(user.role)));

	async function handleLogout() {
		document.cookie = 'userId=; path=/; max-age=0';
		document.cookie = 'userName=; path=/; max-age=0';
		document.cookie = 'userRole=; path=/; max-age=0';
		await goto('/login');
	}

	async function handleSwitchRole() {
		document.cookie = 'userId=; path=/; max-age=0';
		document.cookie = 'userName=; path=/; max-age=0';
		document.cookie = 'userRole=; path=/; max-age=0';
		await goto('/login');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="min-h-screen bg-gray-50 flex" style="font-family: 'Noto Sans SC', sans-serif;">
	<aside
		class="fixed inset-y-0 left-0 z-50 w-64 bg-teal-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex flex-col h-full">
			<div class="flex items-center justify-between h-16 px-6 border-b border-teal-600">
				<h1 class="text-xl font-bold text-white">艺术培训机构</h1>
				<button
					onclick={toggleSidebar}
					class="lg:hidden p-2 rounded-lg text-teal-200 hover:bg-teal-600 transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<nav class="flex-1 px-3 py-4 space-y-1">
				{#each filteredMenuItems as item (item.id)}
					<a
						href={item.path}
						class="flex items-center px-4 py-3 rounded-lg text-teal-100 hover:bg-teal-600 hover:text-white transition-colors duration-200 group {$page.url
							.pathname === item.path
							? 'bg-teal-600 text-white'
							: ''}"
					>
						<svelte:component
							this={item.icon}
							size={20}
							class="mr-3 flex-shrink-0 {$page.url.pathname === item.path ? 'text-white' : 'text-teal-300 group-hover:text-white'}"
						/>
						<span class="font-medium">{item.name}</span>
					</a>
				{/each}
			</nav>

			<div class="p-4 border-t border-teal-600">
				<div class="flex items-center">
					<div class="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
						{user.name.charAt(0).toUpperCase()}
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-white">{user.name}</p>
						<p class="text-xs text-teal-300">{roleNames[user.role]}</p>
					</div>
				</div>
			</div>
		</div>
	</aside>

	{#if sidebarOpen}
		<button
			type="button"
			class="fixed inset-0 z-40 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="关闭侧边栏"
		></button>
	{/if}

	<div class="flex-1 flex flex-col min-w-0">
		<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
			<div class="flex items-center">
				<button
					onclick={toggleSidebar}
					class="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors mr-4"
				>
					<Menu size={20} />
				</button>
				<h2 class="text-lg font-semibold text-gray-800">
					{filteredMenuItems.find((item) => item.path === $page.url.pathname)?.name || '首页'}
				</h2>
			</div>

			<div class="flex items-center space-x-3">
				<div class="hidden sm:flex items-center px-3 py-1.5 bg-teal-50 rounded-lg">
					<span class="text-sm text-teal-700 font-medium">{roleNames[user.role]}</span>
				</div>

				<div class="relative group">
					<button
						onclick={handleSwitchRole}
						class="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
					>
						<UserRound size={18} class="mr-1.5" />
						<span class="hidden sm:inline">切换角色</span>
					</button>
				</div>

				<button
					onclick={handleLogout}
					class="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
				>
					<LogOut size={18} class="mr-1.5" />
					<span class="hidden sm:inline">退出登录</span>
				</button>
			</div>
		</header>

		<main class="flex-1 p-4 lg:p-6 overflow-auto">
			{@render children()}
		</main>
	</div>
</div>
