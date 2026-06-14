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

  $: severityGroups = (() => {
    const map = {};
    allAbnormal.forEach(o => {
      const sev = o.last_abnormal.abnormal_severity || 'medium';
      if (!map[sev]) map[sev] = [];
      map[sev].push(o);
    });
    return map;
  })();

  $: roleGroups = (() => {
    const map = {};
    allAbnormal.forEach(o => {
      const r = STATUS[o.current_status]?.role;
      if (r) {
        if (!map[r]) map[r] = [];
        map[r].push(o);
      }
    });
    return map;
  })();

  $: repeatRiskOrders = allAbnormal.filter(o => o.last_abnormal.abnormal_count > 1);

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
            <h2 class="font-bold text-slate-800">异常等级分布</h2>
            <p class="text-xs text-slate-500 mt-1">按严重程度分组，优先处理高级别</p>
          </div>
          <div class="p-5 space-y-2">
            {#each [
              { key: 'critical', label: '🔴 严重级', color: 'bg-rose-700', textColor: 'text-rose-700', bg: 'bg-rose-50' },
              { key: 'high', label: '🟠 高级', color: 'bg-red-500', textColor: 'text-red-600', bg: 'bg-red-50' },
              { key: 'medium', label: '🟡 中级', color: 'bg-amber-500', textColor: 'text-amber-600', bg: 'bg-amber-50' }
            ] as sev}
              <div class="flex items-center gap-3 p-3 rounded-lg {sev.bg}">
                <span class="text-sm font-medium {sev.textColor} flex-1">
                  {sev.label}
                </span>
                <span class="text-xl font-bold {sev.textColor}">
                  {(severityGroups[sev.key] || []).length}
                </span>
              </div>
            {/each}
            {#if allAbnormal.length === 0}
              <div class="text-xs text-slate-400 text-center py-2">当前无异常</div>
            {/if}
          </div>
        </div>

        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">待重办角色分布</h2>
            <p class="text-xs text-slate-500 mt-1">各角色待处理异常数量</p>
          </div>
          <div class="p-5 space-y-2">
            {#each [
              { key: 'APPRAISER', label: '评估师', icon: '👤' },
              { key: 'STORAGE', label: '库管', icon: '🏬' },
              { key: 'FINANCE', label: '财务', icon: '💰' }
            ] as r}
              <div class="flex items-center gap-3 p-3 rounded-lg {role === r.key ? 'ring-2 ring-blue-300 bg-blue-50' : 'bg-slate-50'}">
                <span class="text-lg">{r.icon}</span>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-700">{r.label}</div>
                  <div class="text-xs text-slate-400">
                    {(roleGroups[r.key] || []).length} 单待重办
                  </div>
                </div>
                {#if role === r.key && (roleGroups[r.key] || []).length > 0}
                  <span class="status-pill bg-blue-500 text-xs">当前角色</span>
                {/if}
              </div>
            {/each}
            {#if allAbnormal.length === 0}
              <div class="text-xs text-slate-400 text-center py-2">当前无异常</div>
            {/if}
          </div>
        </div>

        {#if repeatRiskOrders.length > 0}
          <div class="card border-2 border-amber-200 bg-amber-50/30">
            <div class="p-5 border-b border-amber-100">
              <h2 class="font-bold text-amber-700">⚠️ 重复退回风险</h2>
              <p class="text-xs text-slate-500 mt-1">以下单据曾被多次异常退回</p>
            </div>
            <div class="divide-y divide-amber-100">
              {#each repeatRiskOrders as o}
                <a href="/orders/{o.id}" class="block hover:bg-white transition p-4">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-semibold text-slate-700">{o.order_no}</span>
                    <span class="status-pill bg-amber-500 text-xs">×{o.last_abnormal.abnormal_count} 次退回</span>
                  </div>
                  <div class="text-xs text-slate-600">{o.item_name} · {o.customer_name}</div>
                  <div class="text-xs text-amber-600 mt-1">最近：{o.last_abnormal.abnormal_label}</div>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="text-center text-slate-400 py-20">加载中...</div>
  {/if}
</div>
