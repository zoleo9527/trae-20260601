<script lang="ts">
  import { page } from '$app/stores'
  import { getStore } from '$lib/store.svelte'
  import { DAMAGE_STATUS_LABELS, COMPENSATION_STATUS_LABELS, ROLE_LABELS, MATERIAL_STATUS_LABELS } from '$lib/types'
  import type { UserRole } from '$lib/types'
  import { ArrowLeft, AlertCircle, UserCheck, FileText, Clock, Link as LinkIcon, Archive } from 'lucide-svelte'

  const store = getStore()
  const id = $derived($page.params.id)

  let damage = $derived(store.damages.find(d => d.id === id) ?? null)
  let linkedCompensation = $derived(store.compensations.find(c => c.damageRecordId === id) ?? null)

  let showAssignModal = $state(false)
  let assignName = $state('')
  let assignRole = $state<UserRole>('freight_clerk')

  let fillGapTargetId = $state<string | null>(null)
  let fillGapName = $state('')
  let fillGapRole = $state<UserRole>('freight_clerk')

  let showCloseConfirm = $state(false)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
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

  function handleAssign() {
    if (!assignName.trim() || !damage) return
    store.assignResponsible(damage.id, assignName.trim(), assignRole)
    showAssignModal = false
    assignName = ''
  }

  function openFillGap(chainNodeId: string) {
    fillGapTargetId = chainNodeId
    fillGapName = ''
    fillGapRole = 'freight_clerk'
  }

  function handleFillGap() {
    if (!fillGapName.trim() || !damage || !fillGapTargetId) return
    store.fillGapNode(damage.id, fillGapTargetId, fillGapName.trim(), fillGapRole)
    fillGapTargetId = null
    fillGapName = ''
  }

  let gapChainNodes = $derived(damage ? damage.responsibilityChain.filter(n => n.isGap) : [])

  let canClose = $derived(() => {
    if (!damage || damage.status === 'completed' || damage.status === 'pending') return false
    if (!linkedCompensation) return damage.status === 'processing' && !damage.hasGap
    return linkedCompensation.status === 'completed'
  })
</script>

{#if damage}
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-6">
      <a href="/damage" class="text-iron-400 hover:text-rail-blue transition-colors">
        <ArrowLeft size={20} />
      </a>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-iron-900">{damage.ticketNo}</h1>
          <span class="rounded px-2 py-0.5 text-xs {statusColor(damage.status)}">
            {DAMAGE_STATUS_LABELS[damage.status]}
          </span>
          {#if damage.hasGap}
            <span class="flex items-center gap-1 text-xs text-danger animate-pulse-danger">
              <AlertCircle size={14} /> 责任链空档
            </span>
          {:else}
            <span class="flex items-center gap-1 text-xs text-success">
              ✓ 责任链完整
            </span>
          {/if}
        </div>
        <p class="text-sm text-iron-500 mt-0.5">{damage.goodsName} · {damage.damageType} · {damage.weight}</p>
      </div>
      {#if damage.status === 'pending' || (damage.status === 'anomaly' && !damage.currentResponsible)}
        <button
          onclick={() => showAssignModal = true}
          class="flex items-center gap-2 px-4 py-2 bg-rail-blue text-white rounded-lg text-sm font-medium hover:bg-rail-blue-dark transition-colors"
        >
          <UserCheck size={16} />
          指派责任人
        </button>
      {/if}
      {#if canClose()}
        <button
          onclick={() => showCloseConfirm = true}
          class="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80 transition-colors"
        >
          <Archive size={16} />
          结案
        </button>
      {/if}
    </div>

    <div class="flex gap-6">
      <div class="flex-1 min-w-0">
        <section class="bg-white rounded-lg shadow p-5 mb-6">
          <h2 class="text-sm font-bold text-iron-700 mb-4 flex items-center gap-2">
            <FileText size={16} /> 基本信息
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-iron-400 text-xs">发站</span>
              <p class="font-medium text-iron-900">{damage.stationFrom}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">到站</span>
              <p class="font-medium text-iron-900">{damage.stationTo}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">托运人</span>
              <p class="font-medium text-iron-900">{damage.consignor}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">收货人</span>
              <p class="font-medium text-iron-900">{damage.consignee}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">货物类型</span>
              <p class="font-medium text-iron-900">{damage.goodsType}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">重量</span>
              <p class="font-medium text-iron-900">{damage.weight}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">登记时间</span>
              <p class="font-medium text-iron-900">{formatDate(damage.createdAt)}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">当前责任人</span>
              <p class="font-medium text-iron-900">
                {damage.currentResponsible
                  ? `${damage.currentResponsible.name}（${ROLE_LABELS[damage.currentResponsible.role]}）`
                  : '未指派'}
              </p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-lg shadow p-5 mb-6">
          <h2 class="text-sm font-bold text-iron-700 mb-4 flex items-center gap-2">
            <Clock size={16} /> 责任时间线
          </h2>
          <div class="relative pl-6">
            {#each damage.timeline as node, i}
              <div class="relative pb-6 last:pb-0">
                <div class="absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 {node.isGap
                  ? 'border-danger bg-danger-light'
                  : 'border-rail-blue bg-rail-blue-light'}"></div>
                {#if i < damage.timeline.length - 1}
                  <div class="absolute left-[-15px] top-4 bottom-0 w-0.5 bg-iron-200"></div>
                {/if}
                <div class="{node.isGap ? 'bg-danger-light/50 border border-danger/30 rounded-lg p-3' : ''}">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold {node.isGap ? 'text-danger' : 'text-rail-blue'}">{node.event}</span>
                    <span class="text-xs text-iron-400">{formatDate(node.timestamp)}</span>
                    {#if node.isGap}
                      <span class="flex items-center gap-1 text-xs text-danger font-medium">
                        <AlertCircle size={12} /> 空档
                      </span>
                    {/if}
                  </div>
                  <p class="text-sm text-iron-700">{node.description}</p>
                  {#if node.responsible}
                    <p class="text-xs text-iron-500 mt-1">
                      责任人：{node.responsible.name}（{ROLE_LABELS[node.responsible.role]}）
                    </p>
                  {:else if node.isGap}
                    <p class="text-xs text-danger mt-1 font-medium">⚠ 该环节无人负责，需补充指派</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>

        <section class="bg-white rounded-lg shadow p-5">
          <h2 class="text-sm font-bold text-iron-700 mb-4 flex items-center gap-2">
            <LinkIcon size={16} /> 责任链
          </h2>
          <div class="flex items-center gap-2 flex-wrap">
            {#each damage.responsibilityChain as node, i}
              {#if i > 0}
                <div class="flex items-center">
                  <div class="w-8 h-0.5 {damage.responsibilityChain[i-1]?.isGap || node.isGap ? 'bg-danger' : 'bg-rail-blue'}"></div>
                  <svg class="w-3 h-3 {damage.responsibilityChain[i-1]?.isGap || node.isGap ? 'text-danger' : 'text-rail-blue'}" viewBox="0 0 10 10">
                    <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
                  </svg>
                </div>
              {/if}
              <div class="rounded-lg px-3 py-2 text-center {node.isGap
                ? 'bg-danger-light border-2 border-danger/50 border-dashed'
                : 'bg-rail-blue/10 border border-rail-blue/30'}">
                <p class="text-xs font-bold {node.isGap ? 'text-danger' : 'text-rail-blue'}">{node.segment}</p>
                <p class="text-xs {node.isGap ? 'text-danger' : 'text-iron-700'}">{node.name}</p>
                {#if node.isGap}
                  <button
                    onclick={() => openFillGap(node.id)}
                    class="mt-1 px-2 py-0.5 text-xs bg-danger text-white rounded hover:bg-danger/80 transition-colors"
                  >
                    补全
                  </button>
                {:else}
                  <p class="text-xs text-iron-400 mt-0.5">{ROLE_LABELS[node.role]}</p>
                {/if}
              </div>
            {/each}
          </div>
          {#if damage.hasGap}
            <div class="mt-4 p-3 bg-danger-light/60 rounded-lg border border-danger/30">
              <p class="text-sm text-danger font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                责任链存在 {gapChainNodes.length} 处空档，点击"补全"按钮指派责任人
              </p>
            </div>
          {:else}
            <div class="mt-4 p-3 bg-success-light rounded-lg border border-success/30">
              <p class="text-sm text-success font-medium">✓ 责任链完整，所有环节已指派责任人</p>
            </div>
          {/if}
        </section>
      </div>

      <aside class="w-72 shrink-0">
        <div class="bg-white rounded-lg shadow p-5 mb-4 sticky top-6">
          <h3 class="text-sm font-bold text-iron-700 mb-3">状态信息</h3>
          <div class="space-y-3 text-sm">
            <div>
              <span class="text-iron-400 text-xs">货损状态</span>
              <p><span class="rounded px-2 py-0.5 text-xs {statusColor(damage.status)}">{DAMAGE_STATUS_LABELS[damage.status]}</span></p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">紧急度</span>
              <p class="font-medium {damage.urgency === 'critical' ? 'text-danger' : damage.urgency === 'urgent' ? 'text-safety-orange' : 'text-iron-600'}">
                {damage.urgency === 'critical' ? '紧急' : damage.urgency === 'urgent' ? '较急' : '一般'}
              </p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">当前责任人</span>
              <p class="font-medium text-iron-900">{damage.currentResponsible?.name ?? '未指派'}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">责任链</span>
              <p class="font-medium {damage.hasGap ? 'text-danger' : 'text-success'}">
                {damage.hasGap ? `${gapChainNodes.length} 处空档` : '完整'}
              </p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">最后更新</span>
              <p class="text-iron-700">{formatDate(damage.updatedAt)}</p>
            </div>
          </div>
        </div>

        {#if linkedCompensation}
          <div class="bg-white rounded-lg shadow p-5 sticky top-80">
            <h3 class="text-sm font-bold text-iron-700 mb-3 flex items-center gap-2">
              <FileText size={14} /> 关联赔付
            </h3>
            <a href="/compensation/{linkedCompensation.id}" class="block">
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-iron-400 text-xs">赔付编号</span>
                  <p class="font-mono text-rail-blue text-xs">{linkedCompensation.compNo}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">赔付金额</span>
                  <p class="font-bold text-iron-900">¥{linkedCompensation.amount.toLocaleString()}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">赔付状态</span>
                  <p><span class="rounded px-2 py-0.5 text-xs {compStatusColor(linkedCompensation.status)}">{COMPENSATION_STATUS_LABELS[linkedCompensation.status]}</span></p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">索赔人</span>
                  <p class="text-iron-700">{linkedCompensation.claimant}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">责任链</span>
                  <p class="font-medium {linkedCompensation.hasGap ? 'text-danger' : 'text-success'}">
                    {linkedCompensation.hasGap ? '存在空档' : '完整'}
                  </p>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-iron-100">
                <p class="text-xs text-iron-500 mb-2">赔付材料</p>
                {#each linkedCompensation.materials as mat}
                  <div class="flex items-center gap-2 text-xs py-1">
                    <span class="w-2 h-2 rounded-full {mat.status === 'verified' ? 'bg-success' : mat.status === 'submitted' ? 'bg-rail-blue' : 'bg-danger'}"></span>
                    <span class="flex-1 text-iron-700">{mat.name}</span>
                    <span class="{mat.status === 'verified' ? 'text-success' : mat.status === 'submitted' ? 'text-rail-blue' : 'text-danger'}">
                      {MATERIAL_STATUS_LABELS[mat.status]}
                    </span>
                  </div>
                {/each}
              </div>
              <p class="mt-3 text-xs text-rail-blue font-medium text-center hover:underline">查看赔付详情 →</p>
            </a>
          </div>
        {:else}
          <div class="bg-iron-50 rounded-lg p-5 text-center text-sm text-iron-400">
            暂无关联赔付记录
          </div>
        {/if}
      </aside>
    </div>
  </div>

  {#if showAssignModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={() => showAssignModal = false}>
      <div role="dialog" aria-label="指派责任人" class="bg-white rounded-xl p-6 w-96 shadow-2xl" onclick={(e) => e.stopPropagation()}>
        <h2 class="text-lg font-bold text-iron-900 mb-4">指派责任人</h2>
        <p class="text-xs text-iron-500 mb-3">将同时补全责任链中所有空档节点</p>
        <div class="space-y-4">
          <div>
            <label for="assign-name" class="block text-sm text-iron-600 mb-1">责任人姓名</label>
            <input
              id="assign-name"
              type="text"
              bind:value={assignName}
              placeholder="输入姓名"
              class="w-full px-3 py-2 rounded-lg border border-iron-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30"
            />
          </div>
          <div>
            <label for="assign-role" class="block text-sm text-iron-600 mb-1">角色</label>
            <select id="assign-role" bind:value={assignRole} class="w-full px-3 py-2 rounded-lg border border-iron-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30">
              <option value="freight_clerk">货运员</option>
              <option value="loading_leader">装卸班长</option>
              <option value="customer_service">客服</option>
              <option value="station_manager">站段管理员</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button onclick={() => showAssignModal = false} class="px-4 py-2 text-sm text-iron-600 hover:bg-iron-100 rounded-lg">取消</button>
          <button onclick={handleAssign} class="px-4 py-2 text-sm bg-rail-blue text-white rounded-lg hover:bg-rail-blue-dark disabled:opacity-50" disabled={!assignName.trim()}>
            确认指派
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if fillGapTargetId}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={() => fillGapTargetId = null}>
      <div role="dialog" aria-label="补全责任链空档" class="bg-white rounded-xl p-6 w-96 shadow-2xl" onclick={(e) => e.stopPropagation()}>
        <h2 class="text-lg font-bold text-iron-900 mb-2">补全责任链空档</h2>
        <p class="text-xs text-danger mb-4">
          为 {damage?.responsibilityChain.find(n => n.id === fillGapTargetId)?.segment ?? '该环节'} 指派责任人
        </p>
        <div class="space-y-4">
          <div>
            <label for="fill-name" class="block text-sm text-iron-600 mb-1">责任人姓名</label>
            <input
              id="fill-name"
              type="text"
              bind:value={fillGapName}
              placeholder="输入姓名"
              class="w-full px-3 py-2 rounded-lg border border-iron-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30"
            />
          </div>
          <div>
            <label for="fill-role" class="block text-sm text-iron-600 mb-1">角色</label>
            <select id="fill-role" bind:value={fillGapRole} class="w-full px-3 py-2 rounded-lg border border-iron-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30">
              <option value="freight_clerk">货运员</option>
              <option value="loading_leader">装卸班长</option>
              <option value="customer_service">客服</option>
              <option value="station_manager">站段管理员</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button onclick={() => fillGapTargetId = null} class="px-4 py-2 text-sm text-iron-600 hover:bg-iron-100 rounded-lg">取消</button>
          <button onclick={handleFillGap} class="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:bg-danger/80 disabled:opacity-50" disabled={!fillGapName.trim()}>
            补全空档
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showCloseConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onclick={() => showCloseConfirm = false}>
      <div role="dialog" aria-label="结案" class="bg-white rounded-xl p-6 w-96 shadow-2xl" onclick={(e) => e.stopPropagation()}>
        <h2 class="text-lg font-bold text-iron-900 mb-2">确认结案</h2>
        <p class="text-sm text-iron-600 mb-4">
          确认对货损记录 <span class="font-mono text-rail-blue">{damage?.ticketNo}</span> 结案？
        </p>
        {#if linkedCompensation?.status === 'completed'}
          <p class="text-xs text-success mb-3">✓ 关联赔付已完成，可以结案</p>
        {:else if !linkedCompensation}
          <p class="text-xs text-success mb-3">✓ 责任链完整，无关联赔付，可以结案</p>
        {/if}
        <div class="flex justify-end gap-3">
          <button onclick={() => showCloseConfirm = false} class="px-4 py-2 text-sm text-iron-600 hover:bg-iron-100 rounded-lg">取消</button>
          <button onclick={() => { if (damage) store.completeDamage(damage.id); showCloseConfirm = false }} class="px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/80">
            确认结案
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="max-w-7xl mx-auto p-6 text-center">
    <p class="text-iron-400 text-lg">未找到该货损记录</p>
    <a href="/damage" class="text-rail-blue text-sm mt-2 inline-block hover:underline">返回列表</a>
  </div>
{/if}
