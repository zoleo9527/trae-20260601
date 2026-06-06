<script lang="ts">
	import { UserCheck, GraduationCap, Building2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let selectedRole = $state('');
	let name = $state('');

	const roles = [
		{
			id: 'consultant',
			name: '课程顾问',
			icon: UserCheck,
			description: '负责学生课程咨询、课包销售和补课安排'
		},
		{
			id: 'teacher',
			name: '任课老师',
			icon: GraduationCap,
			description: '负责授课、确认课包消耗和学生进度跟踪'
		},
		{
			id: 'admin',
			name: '校区主管',
			icon: Building2,
			description: '负责校区整体管理、数据统计和人员调度'
		}
	];

	const error = $derived($page.url.searchParams.get('error'));
</script>

<div class="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4" style="font-family: 'Noto Sans SC', sans-serif;">
	<div class="w-full max-w-2xl">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-teal-700 mb-2">艺术培训机构管理系统</h1>
			<p class="text-gray-500">请选择您的角色并输入姓名登录</p>
		</div>

		{#if error}
			<div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-center">
				{error}
			</div>
		{/if}

		<form method="POST" action="/login" use:enhance class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each roles as role (role.id)}
					<button
						type="button"
						onclick={() => (selectedRole = role.id)}
						class="relative p-6 bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg group {selectedRole === role.id
							? 'border-teal-600 shadow-lg ring-4 ring-teal-100'
							: 'border-gray-200 hover:border-teal-300'}"
					>
						<input type="radio" name="role" value={role.id} class="sr-only" checked={selectedRole === role.id} />
						<div class="flex flex-col items-center text-center">
							<div
								class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 {selectedRole === role.id
									? 'bg-teal-600 text-white'
									: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'}"
							>
								<svelte:component this={role.icon} size={28} strokeWidth={2} />
							</div>
							<h3
								class="text-lg font-semibold mb-2 transition-colors duration-300 {selectedRole === role.id
									? 'text-teal-700'
									: 'text-gray-700'}"
							>
								{role.name}
							</h3>
							<p class="text-sm text-gray-500">{role.description}</p>
						</div>
						{#if selectedRole === role.id}
							<div class="absolute top-3 right-3 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
								<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">姓名</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					placeholder="请输入您的姓名"
					required
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
				/>
			</div>

			<button
				type="submit"
				disabled={!selectedRole || !name.trim()}
				class="w-full py-4 px-6 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
			>
				登录系统
			</button>
		</form>

		<p class="text-center text-sm text-gray-400 mt-8">© 2024 艺术培训机构管理系统</p>
	</div>
</div>
