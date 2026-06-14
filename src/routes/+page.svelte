<script>
  import { onMount } from 'svelte';
  import { STATUS, ROLES } from '$lib/constants.js';
  import { currentRole } from '$lib/stores.js';

  let stats = null;
  let orders = [];
  let role = 'APPRAISER';

  $: role = $currentRole;

  const rolePendingStatus = {
    APPRAISER: ['OVERDUE_PENDING', 'FINANCIAL_SETTLED', 'CUSTOMER_NOTIFIED'],
    STORAGE: ['OVERDUE_CONFIRMED'],
    FINANCE: ['STORAGE_CHECKED', 'DISPOSAL_PENDING']
  };

  onMount(async () => {
    const [s, o] = await Promise.all([
      fetch('/api/orders?stats=1').then(r => r.json()),
      fetch('/api/orders').then(r => r.json())
    ]);
    stats = s;
    orders = o;
  });

  $: pendingForMe = orders.filter(o => rolePendingStatus[role]?.includes(o.current_status));
  $: activeOrders = orders.filter(o => !['CLOSED', 'NORMAL'].includes(o.current_status));
  $: abnormalForMe = orders.filter(o => o.last_abnormal && rolePendingStatus[role]?.includes(o.current_status));
  $: allAbnormal = orders.filter(o => o.last_abnormal);

  function overdueDays(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  }
</script>

<div class="max-w-7xl mx-auto px-6 py-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-slate-800 mb-1">工作台</h1>
    <p class="text-sm text-slate-500">当前以【<span class="font-medium text-slate-700">{ROLES[role]?.name}</span>】身份处理业务，状态流转全程可追溯</p>
  </div>

  {#if stats}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500 font-medium">逾期待处理</div>
            <div class="text-3xl font-bold text-red-600 mt-1">{stats.overdue}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">⏰</div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500 font-medium">待我处理</div>
            <div class="text-3xl font-bold text-blue-600 mt-1">{pendingForMe.length}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">📥</div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500 font-medium">处理中流程</div>
            <div class="text-3xl font-bold text-amber-600 mt-1">{activeOrders.length}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">🔄</div>
        </div>
      </div>
      <div class="card p-5 cursor-pointer hover:shadow-md transition" on:click={() => document.location = '/orders?filter=abnormal'}>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500 font-medium">异常待办（退回给我）</div>
            <div class="text-3xl font-bold text-rose-600 mt-1">{abnormalForMe.length}</div>
            <div class="text-xs text-slate-400 mt-1">全部异常 {allAbnormal.length} 单</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl">🚨</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        {#if abnormalForMe.length > 0}
          <div class="card border-2 border-rose-200 bg-rose-50/30">
            <div class="flex items-center justify-between p-5 border-b border-rose-100">
              <div>
                <h2 class="font-bold text-rose-700">🚨 异常待办（退回给我）</h2>
                <p class="text-xs text-slate-500 mt-1">共 {abnormalForMe.length} 单被退回，请优先处理</p>
              </div>
              <a href="/orders?filter=abnormal" class="text-sm text-rose-600 hover:underline font-medium">查看全部异常 →</a>
            </div>
            <div class="divide-y divide-rose-100">
              {#each abnormalForMe as o}
                <a href="/orders/{o.id}" class="block hover:bg-white transition p-5">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap items-center gap-2 mb-1.5">
                        <span class="font-mono text-sm font-semibold text-slate-700">{o.order_no}</span>
                        <span class="status-pill" style="background: {STATUS[o.current_status]?.color}">{STATUS[o.current_status]?.label}</span>
                        {#if o.last_abnormal}
                          <span class="status-pill {o.last_abnormal.abnormal_severity === 'critical' ? 'bg-rose-700' : o.last_abnormal.abnormal_severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}">
                            🚨 {o.last_abnormal.abnormal_label}
                          </span>
                        {/if}
                      </div>
                      <div class="text-sm text-slate-700 font-medium">{o.item_name} · {o.customer_name}</div>
                      {#if o.last_abnormal}
                        <div class="text-xs text-slate-500 mt-1">
                          <span class="text-rose-600 font-medium">退回来源：</span>
                          <span class="font-medium">{ROLES[o.last_abnormal.returned_from_role]?.name} · {o.last_abnormal.returned_from_name}</span>
                          <span class="text-slate-400 mx-1">|</span>
                          <span>退回时间：{o.last_abnormal.created_at}</span>
                        </div>
                        {#if o.last_abnormal.alert_message}
                          <div class="text-xs text-rose-600 mt-1.5 bg-rose-50 rounded px-2 py-1 inline-block">⚠️ {o.last_abnormal.alert_message}</div>
                        {/if}
                      {/if}
                    </div>
                    <div class="shrink-0">
                      <span class="role-badge" style="background: {ROLES[STATUS[o.current_status]?.role]?.color || '#64748b'}">
                        待我重办
                      </span>
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <div class="card">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">待我处理</h2>
            <a href="/orders" class="text-sm text-blue-600 hover:underline">查看全部 →</a>
          </div>
          <div class="divide-y divide-slate-100">
            {#if pendingForMe.length === 0}
              <div class="p-10 text-center text-slate-400">
                <div class="text-4xl mb-2">🎉</div>
                <div class="text-sm">当前角色下暂无待处理事项</div>
                <div class="text-xs mt-1">试试切换角色查看其他环节</div>
              </div>
            {/if}
            {#each pendingForMe as o}
              <a href="/orders/{o.id}" class="block hover:bg-slate-50 transition p-5">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="font-mono text-sm font-semibold text-slate-700">{o.order_no}</span>
                      <span class="status-pill" style="background: {STATUS[o.current_status]?.color}">{STATUS[o.current_status]?.label}</span>
                      {#if o.last_abnormal}
                        <span class="status-pill bg-rose-500">🚨 退回重办</span>
                      {/if}
                    </div>
                    <div class="text-sm text-slate-700 font-medium">{o.item_name} · {o.customer_name}</div>
                    <div class="text-xs text-slate-500 mt-1">当金 ¥{o.loan_amount.toLocaleString()} · 到期 {o.due_date} · 逾期 <span class="text-red-600 font-medium">{overdueDays(o.due_date)} 天</span></div>
                  </div>
                  <div class="ml-4">
                    <span class="role-badge" style="background: {ROLES[STATUS[o.current_status]?.role]?.color || '#64748b'}">
                      → {ROLES[STATUS[o.current_status]?.role]?.name || '待处理'}
                    </span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">接力流程</h2>
            <p class="text-xs text-slate-500 mt-1">按角色接力推进，每步留痕可追溯</p>
          </div>
          <div class="p-5 space-y-3">
            {#each [
              { step: 1, role: 'APPRAISER', name: '评估师', desc: '确认逾期' },
              { step: 2, role: 'STORAGE', name: '库管', desc: '核验当物' },
              { step: 3, role: 'FINANCE', name: '财务', desc: '费用结算' },
              { step: 4, role: 'APPRAISER', name: '评估师', desc: '通知客户' }
            ] as s}
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style="background: {ROLES[s.role].color}">{s.step}</div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-700">{ROLES[s.role].name} <span class="text-slate-400 text-xs ml-1">{s.desc}</span></div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">异常触发提示</h2>
            <p class="text-xs text-slate-500 mt-1">流程中任一环节发现异常可退回重办</p>
          </div>
          <div class="p-5 space-y-2">
            {#each [
              { icon: '🔴', text: '当物损坏/封签破损', color: 'text-red-600' },
              { icon: '🟠', text: '证件/资料缺失', color: 'text-amber-600' },
              { icon: '🟡', text: '核算金额异议', color: 'text-yellow-700' },
              { icon: '🔵', text: '客户申诉', color: 'text-blue-600' }
            ] as a}
              <div class="text-sm flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <span>{a.icon}</span>
                <span class={a.color}>{a.text}</span>
                <span class="ml-auto text-xs text-slate-400">可退回</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center text-slate-400 py-20">加载中...</div>
  {/if}
</div>
