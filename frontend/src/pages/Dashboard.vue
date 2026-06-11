<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, AlertTriangle, Clock, ArrowRight, FileText, MessageSquare, AlertCircle } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import type { DashboardOverview, RiskItem, RecentChange } from '@/types'

const router = useRouter()
const { get } = useApi()

const overview = ref<DashboardOverview | null>(null)
const risks = ref<RiskItem[]>([])
const recentChanges = ref<RecentChange[]>([])
const loading = ref(true)

const statusColors: Record<string, string> = {
  '待整理': 'bg-slate-500',
  '待审核': 'bg-blue-500',
  '待签认': 'bg-amber-500',
  '已签认': 'bg-emerald-500',
  '已驳回': 'bg-red-500',
}

const statusTextColors: Record<string, string> = {
  '待整理': 'text-slate-400',
  '待审核': 'text-blue-400',
  '待签认': 'text-amber-400',
  '已签认': 'text-emerald-400',
  '已驳回': 'text-red-400',
}

const changeIcons: Record<string, any> = {
  'status_change': FileText,
  'new_remark': MessageSquare,
  'new_exception': AlertCircle,
}

function formatTime(ts: string) {
  const d = new Date(ts + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}分钟前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}

onMounted(async () => {
  try {
    const [ov, rk, rc] = await Promise.all([
      get<DashboardOverview>('/dashboard/overview'),
      get<RiskItem[]>('/dashboard/risks'),
      get<RecentChange[]>('/dashboard/recent-changes')
    ])
    overview.value = ov
    risks.value = rk
    recentChanges.value = rc
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">总览仪表盘</h1>
        <p class="text-slate-400 text-sm mt-1">竣工资料与客户签认全景视图</p>
      </div>
      <div class="text-xs text-slate-500">数据实时更新</div>
    </div>

    <!-- Three Question Cards -->
    <div class="grid grid-cols-3 gap-4" v-if="!loading && overview">
      <!-- Card 1: Who is processing -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users :size="20" class="text-blue-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-300">谁在处理</div>
            <div class="text-xs text-slate-500">各角色当前处理数量</div>
          </div>
        </div>
        <div class="space-y-3">
          <div v-for="role in overview.byRole" :key="role.role" class="flex items-center justify-between">
            <span class="text-sm text-slate-400">{{ role.role }}</span>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-white">{{ role.count }}</span>
              <span v-if="role.overdueCount > 0" class="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 animate-pulse-danger">
                {{ role.overdueCount }}超时
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: Where is it stuck -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock :size="20" class="text-amber-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-300">卡在哪里</div>
            <div class="text-xs text-slate-500">状态分布</div>
          </div>
        </div>
        <div class="h-6 rounded-full overflow-hidden flex bg-slate-700">
          <div
            v-for="s in overview.byStatus"
            :key="s.status"
            :class="statusColors[s.status]"
            :style="{ width: (s.count / overview.totalDocuments * 100) + '%' }"
            class="h-full transition-all duration-500"
            :title="s.status + ': ' + s.count"
          ></div>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          <div v-for="s in overview.byStatus" :key="s.status" class="flex items-center gap-1.5">
            <div :class="statusColors[s.status]" class="w-2.5 h-2.5 rounded-full"></div>
            <span class="text-xs" :class="statusTextColors[s.status]">{{ s.status }}</span>
            <span class="text-xs font-medium text-white">{{ s.count }}</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Why isn't it signed -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle :size="20" class="text-red-400" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-300">为什么没签完</div>
            <div class="text-xs text-slate-500">风险项 {{ risks.length }} 个</div>
          </div>
        </div>
        <div class="space-y-2 max-h-[140px] overflow-y-auto">
          <div
            v-for="risk in risks"
            :key="risk.id"
            class="flex items-center justify-between py-1.5 px-2 rounded bg-red-500/5 border-l-2 border-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
            @click="router.push(`/documents/${risk.id}`)"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs text-white truncate">{{ risk.project_name }}</div>
              <div class="text-xs text-red-400">{{ risk.riskReason }}</div>
            </div>
            <ArrowRight :size="14" class="text-slate-500 flex-shrink-0 ml-2" />
          </div>
          <div v-if="risks.length === 0" class="text-xs text-slate-500 text-center py-2">暂无风险项</div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div class="grid grid-cols-3 gap-4" v-if="loading">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-10 bg-slate-700 rounded mb-4"></div>
        <div class="space-y-2">
          <div class="h-4 bg-slate-700 rounded"></div>
          <div class="h-4 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <!-- Bottom section: Recent Changes -->
    <div class="card" v-if="!loading">
      <div class="flex items-center gap-2 mb-4">
        <Clock :size="16" class="text-slate-400" />
        <span class="text-sm font-medium text-slate-300">最近变更</span>
      </div>
      <div class="relative pl-6 space-y-4 max-h-[300px] overflow-y-auto">
        <div class="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700"></div>
        <div v-for="change in recentChanges" :key="change.timestamp + change.type" class="relative">
          <div class="absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 border-slate-600 bg-slate-800" :class="{
            'border-blue-500': change.type === 'status_change',
            'border-amber-500': change.type === 'new_remark',
            'border-red-500': change.type === 'new_exception',
          }"></div>
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-white">{{ change.projectName }}</div>
              <div class="text-xs text-slate-400">{{ change.description }}</div>
            </div>
            <span class="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">{{ formatTime(change.timestamp) }}</span>
          </div>
        </div>
        <div v-if="recentChanges.length === 0" class="text-xs text-slate-500 text-center py-4">暂无变更记录</div>
      </div>
    </div>
  </div>
</template>
