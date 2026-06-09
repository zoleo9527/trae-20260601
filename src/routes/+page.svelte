<script lang="ts">
  import { getStore } from '$lib/store.svelte'
  import { DAMAGE_STATUS_LABELS, COMPENSATION_STATUS_LABELS, ROLE_LABELS, MATERIAL_STATUS_LABELS } from '$lib/types'
  import type { DamageRecord, CompensationRecord, UserRole } from '$lib/types'
  import { AlertTriangle, Clock, CheckCircle, AlertCircle, FileWarning, ArrowRight } from 'lucide-svelte'

  const store = getStore()

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function urgencyClass(u: string) {
    if (u === 'critical') return 'border-l-4 border-l-danger'
    if (u === 'urgent') return 'border-l-4 border-l-safety-orange'
    return 'border-l-4 border-l-rail-blue'
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

  function compStatusColor(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-safety-orange text-white',
      accepted: 'bg-rail-blue text-white',
      material_incomplete: 'bg-danger text-white',
      reviewing: 'bg-rail-blue-light text-white',
      completed: 'bg-success text-white',
    }
    return map[s] ?? 'bg-iron-400 text-white'
  }

  let rolePendingDamages = $derived(
    store.damages.filter(d => {
      if (store.currentRole === 'freight_clerk') return d.status === 'pending' || (d.status === 'processing' && d.currentResponsible?.role === 'freight_clerk')
      if (store.currentRole === 'loading_leader') return d.status === 'processing' && d.currentResponsible?.role === 'loading_leader'
      if (store.currentRole === 'customer_service') return d.status === 'completed' && store.compensations.some(c => c.damageRecordId === d.id && (c.status === 'pending' || c.status === 'material_incomplete'))
      return d.status === 'anomaly'
    })
  )

  let rolePendingCompensations = $derived(
    store.compensations.filter(c => {
      if (store.currentRole === 'customer_service') return c.status === 'pending' || c.status === 'material_incomplete' || c.status === 'accepted'
      if (store.currentRole === 'station_manager') return c.status === 'reviewing'
      return false
    })
  )

  let roleLabel = $derived(ROLE_LABELS[store.currentRole])

  let roleTodoHint = $derived(() => {
    const hints: Record<UserRole, string> = {
      freight_clerk: '您有待登记和跟进的货损记录',
      loading_leader: '您有装卸作业相关的待办事项',
      customer_service: '您有赔付受理和材料催缴的待办',
      station_manager: '您有责任认定和审核的待办事项'
    }
    return hints[store.currentRole]
  })
</script>

<div class="max-w-7xl mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-xl font-bold text-iron-900">工作台</h1>
    <p class="text-sm text-iron-500 mt-1">当前角色：{roleLabel} — {roleTodoHint()}</p>
  </div>

  {#if store.gapDamages.length > 0}
    <section class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <AlertCircle size={18} class="text-danger animate-pulse-danger" />
        <h2 class="text-sm font-bold text-danger">责任链空档</h2>
        <span class="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{store.gapDamages.length}</span>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each store.gapDamages as dmg}
          <a href="/damage/{dmg.id}"
            class="rounded-lg border-2 border-danger/30 bg-danger-light/40 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
              <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
            </div>
            <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} · {dmg.damageType}</p>
            <p class="text-xs text-danger font-medium">
              {#each dmg.responsibilityChain as node}
                {#if node.isGap}
                  ⚠ {node.segment}：{node.name}
                {/if}
              {/each}
            </p>
            <p class="text-xs text-iron-500 mt-1">{dmg.stationFrom} → {dmg.stationTo}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <section class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <Clock size={18} class="text-safety-orange" />
      <h2 class="text-sm font-bold text-iron-900">待办事项</h2>
      <span class="rounded-full bg-safety-orange px-2 py-0.5 text-xs text-white">{rolePendingDamages.length + rolePendingCompensations.length}</span>
    </div>

    {#if rolePendingDamages.length > 0}
      <h3 class="text-xs font-semibold text-iron-500 mb-2 uppercase tracking-wide">货损待办</h3>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mb-4">
        {#each rolePendingDamages as dmg}
          <a href="/damage/{dmg.id}"
            class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow {urgencyClass(dmg.urgency)} cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
              <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
            </div>
            <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} · {dmg.damageType}</p>
            <p class="text-xs text-iron-500">{dmg.stationFrom} → {dmg.stationTo}</p>
            <p class="text-xs text-iron-400 mt-1">{formatDate(dmg.updatedAt)}</p>
          </a>
        {/each}
      </div>
    {/if}

    {#if rolePendingCompensations.length > 0}
      <h3 class="text-xs font-semibold text-iron-500 mb-2 uppercase tracking-wide">赔付待办</h3>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each rolePendingCompensations as comp}
          {@const linkedDmg = store.damages.find(d => d.id === comp.damageRecordId)}
          <a href="/compensation/{comp.id}"
            class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-safety-orange cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-iron-600">{comp.compNo}</span>
              <span class="rounded px-1.5 py-0.5 text-xs {compStatusColor(comp.status)}">{COMPENSATION_STATUS_LABELS[comp.status]}</span>
            </div>
            <p class="text-sm font-bold text-iron-900 mb-1">
              {linkedDmg?.goodsName ?? '—'} · ¥{comp.amount.toLocaleString()}
            </p>
            <p class="text-xs text-iron-500">{comp.claimant}</p>
            {#if comp.materials.some(m => m.status === 'missing')}
              <p class="text-xs text-danger mt-1">
                <FileWarning size={12} class="inline" /> 缺失{comp.materials.filter(m => m.status === 'missing').length}份材料
              </p>
            {/if}
          </a>
        {/each}
      </div>
    {/if}

    {#if rolePendingDamages.length === 0 && rolePendingCompensations.length === 0}
      <div class="text-center py-8 text-iron-400">
        <CheckCircle size={32} class="mx-auto mb-2 text-success" />
        <p class="text-sm">当前角色暂无待办事项</p>
      </div>
    {/if}
  </section>

  <section class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <AlertTriangle size={18} class="text-danger" />
      <h2 class="text-sm font-bold text-iron-900">异常工单</h2>
      <span class="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{store.anomalyDamages.length}</span>
    </div>
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {#each store.anomalyDamages as dmg}
        <a href="/damage/{dmg.id}"
          class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-danger cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
            <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
          </div>
          <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} · {dmg.damageType}</p>
          <p class="text-xs text-danger font-medium">
            {#if dmg.hasGap}责任链存在空档{/if}
          </p>
          <p class="text-xs text-iron-500 mt-1">{dmg.stationFrom} → {dmg.stationTo}</p>
        </a>
      {/each}
    </div>
  </section>

  <section class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <CheckCircle size={18} class="text-success" />
      <h2 class="text-sm font-bold text-iron-900">已完成</h2>
      <span class="rounded-full bg-success px-2 py-0.5 text-xs text-white">{store.completedDamages.length + store.completedCompensations.length}</span>
    </div>
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {#each store.completedDamages as dmg}
        <a href="/damage/{dmg.id}"
          class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-success cursor-pointer opacity-80">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
            <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
          </div>
          <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} · {dmg.damageType}</p>
          <p class="text-xs text-iron-500">{dmg.stationFrom} → {dmg.stationTo}</p>
        </a>
      {/each}
      {#each store.completedCompensations as comp}
        {@const linkedDmg = store.damages.find(d => d.id === comp.damageRecordId)}
        <a href="/compensation/{comp.id}"
          class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-success cursor-pointer opacity-80">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-iron-600">{comp.compNo}</span>
            <span class="rounded px-1.5 py-0.5 text-xs {compStatusColor(comp.status)}">{COMPENSATION_STATUS_LABELS[comp.status]}</span>
          </div>
          <p class="text-sm font-bold text-iron-900 mb-1">{linkedDmg?.goodsName ?? '—'} · ¥{comp.amount.toLocaleString()}</p>
          <p class="text-xs text-iron-500">{comp.claimant}</p>
        </a>
      {/each}
    </div>
  </section>
</div>
