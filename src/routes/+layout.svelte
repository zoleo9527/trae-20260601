<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let user: any = null;
	let loading = true;

	onMount(async () => {
		try {
			const res = await fetch('/api/auth/current-user');
			const data = await res.json();
			user = data.user;
		} catch (e) {
			user = null;
		}
		loading = false;
	});

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		user = null;
		window.location.href = '/login';
	}

	$: isLoginPage = window.location.pathname === '/login';
</script>

{#if loading}
	<div class="loading">加载中...</div>
{:else if !user && !isLoginPage}
	<script>
		window.location.href = '/login';
	</script>
{:else}
	{#if user}
		<nav class="nav">
			<div class="nav-brand">
				<a href="/">税务风险跟踪系统</a>
			</div>
			<div class="nav-menu">
				<a href="/" class="nav-link">仪表盘</a>
				<a href="/risk-alerts" class="nav-link">风险提示</a>
				<a href="/todos" class="nav-link">我的待办</a>
			</div>
			<div class="nav-user">
				<span class="user-name">{user.name}</span>
				<span class="user-role">
					{#if user.role === 'tax_advisor'}
						税务顾问
					{:else if user.role === 'project_manager'}
						项目经理
					{:else if user.role === 'client_finance'}
						客户财务
					{/if}
				</span>
				<button class="btn btn-secondary btn-sm" onclick={logout}>退出</button>
			</div>
		</nav>
	{/if}
	<main>
		<slot />
	</main>
{/if}

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		font-size: 1.125rem;
		color: var(--text-secondary);
	}

	.nav {
		background: var(--card-bg);
		border-bottom: 1px solid var(--border-color);
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-brand a {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--primary-color);
		text-decoration: none;
	}

	.nav-menu {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.nav-link:hover {
		color: var(--primary-color);
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.user-role {
		font-size: 0.75rem;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}

	main {
		min-height: calc(100vh - 60px);
	}
</style>