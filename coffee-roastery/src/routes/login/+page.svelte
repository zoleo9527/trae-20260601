<script lang="ts">
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			if (res.ok) {
				window.location.href = '/';
			} else {
				const data = await res.json();
				error = data.error || '登录失败';
			}
		} catch {
			error = '网络错误';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-stone-100 flex items-center justify-center">
	<div class="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
		<h1 class="text-2xl font-bold text-stone-800 mb-1">咖啡烘焙厂</h1>
		<p class="text-stone-500 text-sm mb-6">生豆入库与烘焙计划系统</p>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{error}</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			<div class="mb-4">
				<label class="block text-sm font-medium text-stone-700 mb-1">用户名</label>
				<input type="text" bind:value={username} class="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" placeholder="请输入用户名" />
			</div>
			<div class="mb-6">
				<label class="block text-sm font-medium text-stone-700 mb-1">密码</label>
				<input type="password" bind:value={password} class="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" placeholder="请输入密码" />
			</div>
			<button type="submit" disabled={loading} class="w-full bg-stone-800 text-white py-2 rounded text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
				{loading ? '登录中...' : '登录'}
			</button>
		</form>

		<div class="mt-6 pt-4 border-t border-stone-200">
			<p class="text-xs text-stone-400 mb-2">演示账号：</p>
			<div class="space-y-1 text-xs text-stone-500">
				<p>烘焙师：roaster_zhang / 123456</p>
				<p>杯测员：cupper_li / 123456</p>
				<p>渠道客服：cs_wang / 123456</p>
			</div>
		</div>
	</div>
</div>
