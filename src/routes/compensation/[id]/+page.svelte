<script lang="ts">
  import { page } from '$app/stores'
  import { getStore } from '$lib/store.svelte'
  import { COMPENSATION_STATUS_LABELS, DAMAGE_STATUS_LABELS, ROLE_LABELS, MATERIAL_STATUS_LABELS } from '$lib/types'
  import { ArrowLeft, AlertCircle, FileText, Upload, Link as LinkIcon, Clock } from 'lucide-svelte'

  const store = getStore()
  const id = $derived($page.params.id)

  let comp = $derived(store.compensations.find(c => c.id === id) ?? null)
  let linkedDamage = $derived(comp ? store.damages.find(d => d.id === comp.damageRecordId) ?? null : null)

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
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

  function damageStatusColor(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-safety-orange text-white',
      processing: 'bg-rail-blue text-white',
      anomaly: 'bg-danger text-white',
      completed: 'bg-success text-white',
    }
    return map[s] ?? 'bg-iron-400 text-white'
  }

  function handleSubmitMaterial(materialId: string) {
    if (!comp) return
    store.submitCompensationMaterial(comp.id, materialId)
  }

  let canSubmitMaterial = $derived(
    comp && (comp.status === 'pending' || comp.status === 'material_incomplete' || comp.status === 'accepted')
  )
</script>

{#if comp}
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-6">
      <a href="/" class="text-iron-400 hover:text-rail-blue transition-colors">
        <ArrowLeft size={20} />
      </a>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-iron-900">赔付 {comp.compNo}</h1>
          <span class="rounded px-2 py-0.5 text-xs {compStatusColor(comp.status)}">
            {COMPENSATION_STATUS_LABELS[comp.status]}
          </span>
          {#if comp.hasGap}
            <span class="flex items-center gap-1 text-xs text-danger">
              <AlertCircle size={14} /> 责任链空档
            </span>
          {/if}
        </div>
        <p class="text-sm text-iron-500 mt-0.5">索赔人：{comp.claimant} · 联系方式：{comp.claimantContact}</p>
      </div>
    </div>

    <div class="flex gap-6">
      <div class="flex-1 min-w-0">
        <section class="bg-white rounded-lg shadow p-5 mb-6">
          <h2 class="text-sm font-bold text-iron-700 mb-4 flex items-center gap-2">
            <FileText size={16} /> 赔付材料
          </h2>
          <div class="space-y-3">
            {#each comp.materials as mat}
              <div class="flex items-center gap-3 p-3 rounded-lg {mat.status === 'missing'
                ? 'bg-danger-light/40 border border-danger/20'
                : mat.status === 'submitted'
                  ? 'bg-warning-light/50 border border-warning/20'
                  : 'bg-success-light/50 border border-success/20'}">
                <div class="w-3 h-3 rounded-full shrink-0 {mat.status === 'verified'
                  ? 'bg-success'
                  : mat.status === 'submitted'
                    ? 'bg-warning'
                    : 'bg-danger'}"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-iron-900">{mat.name}</span>
                    <span class="text-xs text-iron-400">{mat.type}</span>
                  </div>
                  <div class="text-xs text-iron-500 mt-0.5">
                    {#if mat.submittedAt && mat.submittedBy}
                      提交于 {formatDate(mat.submittedAt)} · 提交人：{mat.submittedBy}
                    {:else}
                      未提交
                    {/if}
                  </div>
                </div>
                <span class="text-xs font-medium px-2 py-0.5 rounded {mat.status === 'verified'
                  ? 'bg-success/20 text-success'
                  : mat.status === 'submitted'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-danger/20 text-danger'}">
                  {MATERIAL_STATUS_LABELS[mat.status]}
                </span>
                {#if mat.status === 'missing' && canSubmitMaterial}
                  <button
                    onclick={() => handleSubmitMaterial(mat.id)}
                    class="flex items-center gap-1 px-3 py-1.5 text-xs bg-rail-blue text-white rounded-lg hover:bg-rail-blue-dark transition-colors shrink-0"
                  >
                    <Upload size={12} /> 补交
                  </button>
                {/if}
              </div>
            {/each}
          </div>
          {#if comp.materials.some(m => m.status === 'missing')}
            <div class="mt-4 p-3 bg-danger-light/60 rounded-lg border border-danger/30">
              <p class="text-sm text-danger font-medium">
                ⚠ 尚有 {comp.materials.filter(m => m.status === 'missing').length} 份材料缺失，请及时补交
              </p>
            </div>
          {/if}
        </section>

        {#if linkedDamage}
          <section class="bg-white rounded-lg shadow p-5 mb-6">
            <h2 class="text-sm font-bold text-iron-700 mb-4 flex items-center gap-2">
              <Clock size={16} /> 责任时间线（关联货损 {linkedDamage.ticketNo}）
            </h2>
            <div class="relative pl-6">
              {#each linkedDamage.timeline as node, i}
                <div class="relative pb-6 last:pb-0">
                  <div class="absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 {node.isGap
                    ? 'border-danger bg-danger-light'
                    : 'border-rail-blue bg-rail-blue-light'}"></div>
                  {#if i < linkedDamage.timeline.length - 1}
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
                      <p class="text-xs text-danger mt-1 font-medium">⚠ 该环节无人负责</p>
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
            {#if comp.responsibilityLinks.length > 0}
              <div class="space-y-2">
                {#each comp.responsibilityLinks as link, i}
                  <div class="flex items-center gap-2 p-3 rounded-lg {link.isGap
                    ? 'bg-danger-light/40 border border-danger/20'
                    : 'bg-rail-blue/5 border border-rail-blue/10'}">
                    <div class="flex-1 text-xs">
                      <span class="font-medium text-iron-700">{link.from.name}</span>
                      <span class="text-iron-400">（{link.from.segment}）</span>
                    </div>
                    <div class="flex items-center gap-1">
                      {#if link.isGap}
                        <AlertCircle size={14} class="text-danger" />
                      {:else}
                        <svg class="w-4 h-4 text-rail-blue" viewBox="0 0 20 20"><path d="M10 4 L16 10 L10 16" fill="none" stroke="currentColor" stroke-width="2" /></svg>
                      {/if}
                    </div>
                    <div class="flex-1 text-xs text-right">
                      <span class="font-medium text-iron-700">{link.to.name}</span>
                      <span class="text-iron-400">（{link.to.segment}）</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
            {#if comp.hasGap}
              <div class="mt-4 p-3 bg-danger-light/60 rounded-lg border border-danger/30">
                <p class="text-sm text-danger font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  责任链存在空档，赔付责任无法完整追溯
                </p>
              </div>
            {/if}
          </section>
        {/if}
      </div>

      <aside class="w-72 shrink-0">
        <div class="bg-white rounded-lg shadow p-5 mb-4 sticky top-6">
          <h3 class="text-sm font-bold text-iron-700 mb-3">赔付信息</h3>
          <div class="space-y-3 text-sm">
            <div>
              <span class="text-iron-400 text-xs">赔付编号</span>
              <p class="font-mono text-rail-blue text-xs">{comp.compNo}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">赔付金额</span>
              <p class="font-bold text-lg text-iron-900">¥{comp.amount.toLocaleString()}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">赔付状态</span>
              <p><span class="rounded px-2 py-0.5 text-xs {compStatusColor(comp.status)}">{COMPENSATION_STATUS_LABELS[comp.status]}</span></p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">创建时间</span>
              <p class="text-iron-700">{formatDate(comp.createdAt)}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">最后更新</span>
              <p class="text-iron-700">{formatDate(comp.updatedAt)}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">索赔人</span>
              <p class="text-iron-700">{comp.claimant}</p>
            </div>
            <div>
              <span class="text-iron-400 text-xs">联系方式</span>
              <p class="text-iron-700 text-xs">{comp.claimantContact}</p>
            </div>
          </div>
        </div>

        {#if linkedDamage}
          <div class="bg-white rounded-lg shadow p-5 sticky top-[22rem]">
            <h3 class="text-sm font-bold text-iron-700 mb-3 flex items-center gap-2">
              <LinkIcon size={14} /> 关联货损
            </h3>
            <a href="/damage/{linkedDamage.id}" class="block">
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-iron-400 text-xs">运单号</span>
                  <p class="font-mono text-rail-blue text-xs">{linkedDamage.ticketNo}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">品名</span>
                  <p class="font-medium text-iron-900">{linkedDamage.goodsName}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">货损类型</span>
                  <p class="text-iron-700">{linkedDamage.damageType}</p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">货损状态</span>
                  <p><span class="rounded px-2 py-0.5 text-xs {damageStatusColor(linkedDamage.status)}">{DAMAGE_STATUS_LABELS[linkedDamage.status]}</span></p>
                </div>
                <div>
                  <span class="text-iron-400 text-xs">路线</span>
                  <p class="text-iron-700 text-xs">{linkedDamage.stationFrom} → {linkedDamage.stationTo}</p>
                </div>
              </div>
              <p class="mt-3 text-xs text-rail-blue font-medium text-center hover:underline">查看货损详情 →</p>
            </a>
          </div>
        {/if}
      </aside>
    </div>
  </div>
{:else}
  <div class="max-w-7xl mx-auto p-6 text-center">
    <p class="text-iron-400 text-lg">未找到该赔付记录</p>
    <a href="/" class="text-rail-blue text-sm mt-2 inline-block hover:underline">返回工作台</a>
  </div>
{/if}
