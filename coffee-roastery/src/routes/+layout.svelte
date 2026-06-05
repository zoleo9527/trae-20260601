<script lang="ts">
	import '../app.css';
	let { children, data } = $props();
</script>

{#if data.user}
	<div class="min-h-screen flex">
		<aside class="w-56 bg-stone-900 text-stone-100 flex flex-col shrink-0">
			<div class="p-4 border-b border-stone-700">
				<h1 class="text-lg font-bold tracking-tight">咖啡烘焙厂</h1>
				<p class="text-xs text-stone-400 mt-0.5">生豆入库与烘焙计划</p>
			</div>
			<nav class="flex-1 py-2">
				<a href="/" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">概览</a>

				<div class="px-4 py-1.5 text-xs text-stone-500 mt-2 uppercase tracking-wider">生豆管理</div>
				<a href="/green-beans" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">入库列表</a>

				<div class="px-4 py-1.5 text-xs text-stone-500 mt-2 uppercase tracking-wider">烘焙计划</div>
				<a href="/roasting-plans" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">计划列表</a>
				<a href="/roasting-plans/review" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">计划回看</a>

				{#if data.user.role === 'cupper'}
					<div class="px-4 py-1.5 text-xs text-stone-500 mt-2 uppercase tracking-wider">杯测</div>
					<a href="/cupping" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">杯测记录</a>
				{/if}

				<div class="px-4 py-1.5 text-xs text-stone-500 mt-2 uppercase tracking-wider">异常</div>
				<a href="/exceptions" class="block px-4 py-2 text-sm hover:bg-stone-800 transition-colors">异常列表</a>
			</nav>
			<div class="p-4 border-t border-stone-700">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center text-xs font-bold">
						{data.user.display_name[0]}
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium truncate">{data.user.display_name}</div>
						<div class="text-xs text-stone-400">
							{data.user.role === 'roaster' ? '烘焙师' : data.user.role === 'cupper' ? '杯测员' : '渠道客服'}
						</div>
					</div>
				</div>
				<form method="POST" action="/api/auth/logout" class="mt-2">
					<button type="submit" class="text-xs text-stone-400 hover:text-stone-200 transition-colors">退出登录</button>
				</form>
			</div>
		</aside>
		<main class="flex-1 bg-stone-50 overflow-auto">
			<div class="p-6">
				{#key data.user?.id}
					{@render children()}
				{/key}
			</div>
		</main>
	</div>
{:else}
	{@render children()}
{/if}
