<script lang="ts">
  import { getStore } from '$lib/store.svelte'
  import { DAMAGE_STATUS_LABELS } from '$lib/types'
  import type { DamageStatus } from '$lib/types'
  import { Search, Filter, AlertCircle } from 'lucide-svelte'

  const store = getStore()

  let searchText = $state('')
  let statusFilter = $state<DamageStatus | 'all'>('all')

  const statuses: (DamageStatus | 'all')[] = ['all', 'pending', 'processing', 'anomaly', 'completed']
  const statusLabels: Record<string, string> = {
    all: '全部',
    ...DAMAGE_STATUS_LABELS
  }

  function statusColor(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-safety-orange text-white',
      processing: 'bg-rail-blue text-white',
      anomaly: 'bg-danger text-white',
      completed: 'bg-success text-white',
    }
    return map[s] ?? 'bg-iron-400 text-white'
  }

  function urgencyBadge(u: string) {
    if (u === 'critical') return 'text-danger font-bold'
    if (u === 'urgent') return 'text-safety-orange font-semibold'
    return 'text-iron-500'
  }

  let filtered = $derived(
    store.damages
      .filter(d => statusFilter === 'all' || d.status === statusFilter)
      .filter(d =>
        !searchText ||
        d.ticketNo.includes(searchText) ||
        d.goodsName.includes(searchText) ||
        d.stationFrom.includes(searchText) ||
        d.stationTo.includes(searchText) ||
        d.damageType.includes(searchText)
      )
  )
</script>

<div class="max-w-7xl mx-auto p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-iron-900">货损记录列表</h1>
    <span class="text-sm text-iron-500">共 {filtered.length} 条</span>
  </div>

  <div class="flex flex-col sm:flex-row gap-3 mb-6">
    <div class="relative flex-1">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-iron-400" />
      <input
        type="text"
        placeholder="搜索运单号、品名、站名..."
        bind:value={searchText}
        class="w-full pl-9 pr-4 py-2 rounded-lg border border-iron-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30 focus:border-rail-blue"
      />
    </div>
    <div class="flex items-center gap-1.5">
      <Filter size={14} class="text-iron-400" />
      {#each statuses as s}
        <button
          onclick={() => statusFilter = s}
          class="px-3 py-1.5 rounded text-xs font-medium transition-all {statusFilter === s
            ? 'bg-rail-blue text-white'
            : 'bg-white text-iron-600 border border-iron-300 hover:bg-iron-100'}"
        >
          {statusLabels[s]}
        </button>
      {/each}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-iron-50 text-iron-600 text-left">
          <th class="px-4 py-3 font-medium">运单号</th>
          <th class="px-4 py-3 font-medium">品名</th>
          <th class="px-4 py-3 font-medium">货损类型</th>
          <th class="px-4 py-3 font-medium">路线</th>
          <th class="px-4 py-3 font-medium">紧急度</th>
          <th class="px-4 py-3 font-medium">状态</th>
          <th class="px-4 py-3 font-medium">空档</th>
          <th class="px-4 py-3 font-medium">当前责任人</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-iron-100">
        {#each filtered as dmg}
          <tr class="hover:bg-iron-50 cursor-pointer transition-colors" onclick={() => window.location.href = `/damage/${dmg.id}`}>
              <td class="px-4 py-3 font-mono text-xs text-rail-blue">{dmg.ticketNo}</td>
              <td class="px-4 py-3 font-medium text-iron-900">{dmg.goodsName}</td>
              <td class="px-4 py-3 text-iron-600">{dmg.damageType}</td>
              <td class="px-4 py-3 text-iron-600 text-xs">{dmg.stationFrom} → {dmg.stationTo}</td>
              <td class="px-4 py-3 {urgencyBadge(dmg.urgency)}">
                {dmg.urgency === 'critical' ? '紧急' : dmg.urgency === 'urgent' ? '较急' : '一般'}
              </td>
              <td class="px-4 py-3">
                <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
              </td>
              <td class="px-4 py-3">
                {#if dmg.hasGap}
                  <span class="text-danger flex items-center gap-1"><AlertCircle size={14} /> 空档</span>
                {:else}
                  <span class="text-success text-xs">无</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-xs text-iron-600">{dmg.currentResponsible?.name ?? '—'}</td>
            </tr>
        {/each}
      </tbody>
    </table>

    {#if filtered.length === 0}
      <div class="text-center py-12 text-iron-400">
        <p class="text-sm">无匹配的货损记录</p>
      </div>
    {/if}
  </div>
</div>
