<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">风险上报</h1>
        <p class="text-slate-400 text-sm">查看和管理所有风险上报记录</p>
      </div>
      <NuxtLink to="/risks/new" class="btn-danger flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新建上报
      </NuxtLink>
    </div>

    <div class="flex gap-3 mb-6">
      <select v-model="filterStatus" class="input-field text-sm min-w-[140px]">
        <option value="">全部状态</option>
        <option value="reported">已上报</option>
        <option value="approved">已审批</option>
        <option value="rejected">已退回</option>
        <option value="resubmitted">已重提</option>
        <option value="archived">已归档</option>
      </select>
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索雪道名称或描述..."
        class="input-field text-sm flex-1"
        @input="debouncedLoad"
      />
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="w-8 h-8 text-orange-400 animate-spin mx-auto" />
    </div>

    <div v-else-if="risks.length === 0" class="text-center py-12">
      <AlertTriangle class="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p class="text-slate-400">暂无风险上报记录</p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="risk in risks"
        :key="risk.id"
        :to="`/risks/${risk.id}`"
        class="card flex items-center gap-4 group cursor-pointer"
      >
        <div class="w-2 h-12 rounded-full shrink-0"
             :class="risk.status === 'rejected' ? 'bg-red-400' : risk.status === 'approved' ? 'bg-emerald-400' : 'bg-orange-400'"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-white truncate">{{ risk.trailName }}</h3>
            <span class="badge" :class="levelBadgeClass(risk.level)">{{ levelLabel(risk.level) }}</span>
            <span v-if="risk.urgency !== 'normal'" class="badge bg-red-500/20 text-red-400">{{ urgencyLabel(risk.urgency) }}</span>
          </div>
          <p class="text-xs text-slate-400 truncate">{{ risk.description }} · {{ risk.createdAt }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span :class="statusBadgeClass(risk.status)">{{ statusLabel(risk.status) }}</span>
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, AlertTriangle, ChevronRight, Loader2 } from 'lucide-vue-next'

const risks = ref<any[]>([])
const loading = ref(true)
const filterStatus = ref('')
const searchKeyword = ref('')
let debounceTimer: any = null

async function loadRisks() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (searchKeyword.value) params.set('keyword', searchKeyword.value)
    risks.value = await $fetch(`/api/risks?${params.toString()}`) as any[]
  } catch (e) {
    console.error('加载风险列表失败', e)
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadRisks, 300)
}

watch(filterStatus, loadRisks)

function levelLabel(l: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return map[l] || l
}

function levelBadgeClass(l: string) {
  const map: Record<string, string> = { low: 'bg-sky-500/20 text-sky-400', medium: 'bg-amber-500/20 text-amber-400', high: 'bg-orange-500/20 text-orange-400', critical: 'bg-red-500/20 text-red-400' }
  return map[l] || ''
}

function urgencyLabel(u: string) {
  const map: Record<string, string> = { urgent: '紧急', immediate: '立即' }
  return map[u] || u
}

function statusLabel(s: string) {
  const map: Record<string, string> = { reported: '已上报', approved: '已审批', rejected: '已退回', resubmitted: '已重提', archived: '已归档' }
  return map[s] || s
}

function statusBadgeClass(s: string) {
  const map: Record<string, string> = { reported: 'badge-reported', approved: 'badge-approved', rejected: 'badge-rejected', resubmitted: 'badge-resubmitted', archived: 'badge-archived' }
  return map[s] || 'badge'
}

onMounted(loadRisks)
</script>
