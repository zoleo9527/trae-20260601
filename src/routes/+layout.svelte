<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { ROLES } from '$lib/constants.js';
  import { currentRole, setRole, showToast, toastMessages } from '$lib/stores.js';
  import { page } from '$app/stores';

  let role = 'APPRAISER';

  onMount(() => {
    const saved = localStorage.getItem('current_role');
    if (saved && ROLES[saved]) {
      role = saved;
    }
  });

  function changeRole(e) {
    const newRole = e.target.value;
    role = newRole;
    setRole(newRole);
    showToast(`已切换到【${ROLES[newRole].name}】视角`, 'success');
  }

  const navItems = [
    { path: '/', label: '工作台', icon: '🏠' },
    { path: '/orders', label: '典当单', icon: '📋' }
  ];
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/dist/tailwind.min.css">
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col">
  <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white text-lg font-bold">典</div>
          <div>
            <div class="font-bold text-slate-800 text-base">典当行 · 逾期处置与客户通知</div>
            <div class="text-xs text-slate-500">状态流转 · 角色接力 · 全程留痕</div>
          </div>
        </div>
        <nav class="flex items-center gap-1">
          {#each navItems as item}
            <a href={item.path} class="px-4 py-2 rounded-lg text-sm font-medium transition {
              $page.url.pathname === item.path || (item.path !== '/' && $page.url.pathname.startsWith(item.path))
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }">
              <span class="mr-1.5">{item.icon}</span>{item.label}
            </a>
          {/each}
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1">
          <span class="text-xs text-slate-500 px-2">当前角色</span>
          <select value={role} on:change={changeRole} class="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500">
            {#each Object.values(ROLES) as r}
              <option value={r.key}>{r.name}</option>
            {/each}
          </select>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-medium">
            {ROLES[role]?.name?.[0] || '?'}
          </div>
          <div class="text-sm">
            <div class="font-medium text-slate-800">
              {role === 'APPRAISER' ? '李评估' : role === 'STORAGE' ? '王库管' : '陈财务'}
            </div>
            <div class="text-xs text-slate-500">{ROLES[role]?.desc}</div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <div class="toast-container">
    {#each $toastMessages as t (t.id)}
      <div class="toast {t.type}">
        <div class="flex items-start gap-2">
          <span class="text-lg">
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warn' ? '⚠️' : 'ℹ️'}
          </span>
          <span class="text-sm text-slate-700">{t.message}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
