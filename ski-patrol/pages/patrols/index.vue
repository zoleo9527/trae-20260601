<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">巡查管理</h1>
        <p class="text-slate-400 text-sm">管理所有雪道巡查记录</p>
      </div>
      <NuxtLink to="/patrols/new" class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新建巡查
      </NuxtLink>
    </div>

    <div class="flex gap-3 mb-6">
      <select v-model="filterStatus" class="input-field text-sm min-w-[140px]">
        <option value="">全部状态</option>
        <option value="pending">待巡查</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
        <option value="archived">已归档</option>
      </select>
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索雪道名称..."
        class="input-field text-sm flex-1"
        @input="debouncedLoad"
      />
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
      <p class="text-slate-400">加载中...</p>
    </div>

    <div v-else-if="patrols.length === 0" class="text-center py-12">
      <Shield class="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p class="text-slate-400">暂无巡查记录</p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="patrol in patrols"
        :key="patrol.id"
        :to="`/patrols/${patrol.id}`"
        class="card flex items-center gap-4 group cursor-pointer"
      >
        <div class="w-2 h-12 rounded-full shrink-0"
             :class="patrol.result === 'issue' ? 'bg-orange-400' : patrol.status === 'completed' ? 'bg-emerald-400' : 'bg-sky-400'"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-white">{{ patrol.trailName }}</h3>
            <span class="badge" :class="difficultyBadgeClass(patrol.trailDifficulty)">{{ difficultyLabel(patrol.trailDifficulty) }}</span>
          </div>
          <p class="text-xs text-slate-400">{{ patrol.type === 'daily' ? '日常巡查' : '专项巡查' }} · {{ patrol.creatorName }}创建 · {{ patrol.createdAt }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="patrol.result === 'issue'" class="badge-reported">有问题</span>
          <span :class="statusBadgeClass(patrol.status)">{{ statusLabel(patrol.status) }}</span>
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Shield, ChevronRight, Loader2 } from 'lucide-vue-next'

const patrols = ref<any[]>([])
const loading = ref(true)
const filterStatus = ref('')
const searchKeyword = ref('')
let debounceTimer: any = null

async function loadPatrols() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (searchKeyword.value) params.set('keyword', searchKeyword.value)
    patrols.value = await $fetch(`/api/patrols?${params.toString()}`) as any[]
  } catch (e) {
    console.error('加载巡查列表失败', e)
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadPatrols, 300)
}

watch(filterStatus, loadPatrols)

function difficultyLabel(d: string) {
  const map: Record<string, string> = { beginner: '初级', intermediate: '中级', advanced: '高级', expert: '专家' }
  return map[d] || d
}

function difficultyBadgeClass(d: string) {
  const map: Record<string, string> = {
    beginner: 'bg-emerald-500/20 text-emerald-400',
    intermediate: 'bg-sky-500/20 text-sky-400',
    advanced: 'bg-amber-500/20 text-amber-400',
    expert: 'bg-red-500/20 text-red-400',
  }
  return map[d] || ''
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: '待巡查', in_progress: '进行中', completed: '已完成', archived: '已归档' }
  return map[s] || s
}

function statusBadgeClass(s: string) {
  const map: Record<string, string> = { pending: 'badge-pending', in_progress: 'badge-progress', completed: 'badge-completed', archived: 'badge-archived' }
  return map[s] || 'badge'
}

onMounted(loadPatrols)
</script>
