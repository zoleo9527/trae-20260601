<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { STATUS, ROLES } from '$lib/constants.js';

  let orders = [];
  let loading = true;
  let filterStatus = 'ALL';
  let filterAbnormal = 'ALL';
  let search = '';

  const statusOptions = [
    { key: 'ALL', label: '全部状态' },
    { key: 'ACTIVE', label: '处理中流程' },
    ...Object.values(STATUS).map(s => ({ key: s.key, label: s.label }))
  ];

  const abnormalOptions = [
    { key: 'ALL', label: '全部单据' },
    { key: 'ABNORMAL', label: '仅异常退回单' },
    { key: 'NORMAL', label: '排除异常退回' }
  ];

  async function load() {
    loading = true;
    orders = await fetch('/api/orders').then(r => r.json());
    loading = false;
    const f = $page.url.searchParams.get('filter');
    if (f === 'abnormal') filterAbnormal = 'ABNORMAL';
  }

  onMount(load);

  $: filtered = orders.filter(o => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return !['CLOSED', 'NORMAL'].includes(o.current_status);
    return o.current_status === filterStatus;
  }).filter(o => {
    if (filterAbnormal === 'ALL') return true;
    if (filterAbnormal === 'ABNORMAL') return !!o.last_abnormal;
    if (filterAbnormal === 'NORMAL') return !o.last_abnormal;
    return true;
  }).filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.order_no.toLowerCase().includes(s) ||
      o.customer_name.includes(search) ||
      o.item_name.includes(search) ||
      o.customer_phone.includes(search);
  });

  function overdueDays(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  }
</script>

<div class="max-w-7xl mx-auto px-6 py-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-slate-800 mb-1">典当单列表</h1>
    <p class="text-sm text-slate-500">查看所有典当单，按状态筛选或搜索定位</p>
  </div>

  <div class="card p-5 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[220px]">
        <label class="label">搜索</label>
        <input bind:value={search} class="input" placeholder="搜索单号 / 客户名 / 物品 / 手机号" />
      </div>
      <div class="min-w-[180px]">
        <label class="label">状态筛选</label>
        <select bind:value={filterStatus} class="select">
          {#each statusOptions as s}
            <option value={s.key}>{s.label}</option>
          {/each}
        </select>
      </div>
      <div class="min-w-[180px]">
        <label class="label">异常筛选</label>
        <select bind:value={filterAbnormal} class="select">
          {#each abnormalOptions as s}
            <option value={s.key}>{s.label}</option>
          {/each}
        </select>
      </div>
      <div class="self-end">
        <button on:click={() => { search = ''; filterStatus = 'ALL'; filterAbnormal = 'ALL'; }} class="btn btn-secondary btn-sm">重置</button>
      </div>
    </div>
  </div>

  <div class="card overflow-hidden">
    {#if loading}
      <div class="p-16 text-center text-slate-400">加载中...</div>
    {:else if filtered.length === 0}
      <div class="p-16 text-center text-slate-400">
        <div class="text-5xl mb-3">📭</div>
        <div>没有符合条件的典当单</div>
      </div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th class="px-5 py-3 font-semibold">单号</th>
            <th class="px-5 py-3 font-semibold">客户</th>
            <th class="px-5 py-3 font-semibold">当物</th>
            <th class="px-5 py-3 font-semibold text-right">当金</th>
            <th class="px-5 py-3 font-semibold">状态</th>
            <th class="px-5 py-3 font-semibold">异常/退回</th>
            <th class="px-5 py-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filtered as o}
            <tr class="hover:bg-slate-50 {o.last_abnormal ? 'bg-rose-50/40' : ''}">
              <td class="px-5 py-4 font-mono font-semibold text-slate-700">
                {o.order_no}
                {#if o.last_abnormal}
                  <span class="ml-1.5 text-xs text-rose-600">🚨</span>
                {/if}
              </td>
              <td class="px-5 py-4">
                <div class="font-medium text-slate-800">{o.customer_name}</div>
                <div class="text-xs text-slate-500">{o.customer_phone}</div>
              </td>
              <td class="px-5 py-4">
                <div class="font-medium text-slate-800">{o.item_name}</div>
                <div class="text-xs text-slate-500 line-clamp-1 max-w-[220px]">{o.item_desc}</div>
              </td>
              <td class="px-5 py-4 text-right font-semibold text-slate-800">¥{o.loan_amount.toLocaleString()}</td>
              <td class="px-5 py-4">
                <div>
                  <span class="status-pill" style="background: {STATUS[o.current_status]?.color}">
                    {STATUS[o.current_status]?.label}
                  </span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {#if o.last_abnormal}
                    <span class="text-rose-600">待重办：{ROLES[STATUS[o.current_status]?.role]?.name || '相关角色'}</span>
                  {:else if STATUS[o.current_status]?.role}
                    当前责任：{ROLES[STATUS[o.current_status]?.role]?.name}
                  {/if}
                </div>
              </td>
              <td class="px-5 py-4">
                {#if o.last_abnormal}
                  <div>
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                      <span class="status-pill {o.last_abnormal.abnormal_severity === 'critical' ? 'bg-rose-700' : o.last_abnormal.abnormal_severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}">
                        🚨 {o.last_abnormal.abnormal_label}
                      </span>
                    </div>
                    <div class="text-xs text-slate-500">
                      <span class="text-rose-600 font-medium">退回自：</span>
                      {ROLES[o.last_abnormal.returned_from_role]?.name} · {o.last_abnormal.returned_from_name}
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">
                      {o.last_abnormal.created_at}
                    </div>
                  </div>
                {:else}
                  <div class="text-xs text-slate-400">无异常</div>
                {/if}
              </td>
              <td class="px-5 py-4 text-right">
                <a href="/orders/{o.id}" class="btn {o.last_abnormal ? 'btn-danger' : 'btn-primary'} btn-sm">
                  {o.last_abnormal ? '去处理 🚨' : '详情 →'}
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
