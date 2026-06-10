<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { ArrowRight, ClipboardCheck, FileText, Clock, AlertTriangle, Plus, Eye } from 'lucide-vue-next'
import Login from '@/pages/Login.vue'
import RoleBadge from '@/components/RoleBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const stats = ref<any>({})
const loading = ref(false)
const recentActions = ref<any[]>([])
const overdueItems = ref<any[]>([])

type OverdueItemType = 'transfer' | 'assessment'

interface OverdueItem {
  id: number
  ear_tag: string
  status: string
  type: OverdueItemType
}

function tagOverdueItems(list: any[], type: OverdueItemType): OverdueItem[] {
  return list.map((item: any) => ({ id: item.id, ear_tag: item.ear_tag, status: item.status, type }))
}

const roleEntries = computed(() => {
  const r = auth.role
  if (r === '繁育员') {
    return [
      { label: '新建转栏', desc: '为断奶仔猪创建转栏记录', icon: Plus, path: '/transfer/new', color: 'border-emerald-500/40 hover:border-emerald-500/80' },
      { label: '待确认转栏', desc: `待处理 ${stats.value.pending_transfer || 0} 条`, icon: ArrowRight, path: '/transfer?status=pending_transfer', color: 'border-amber-500/40 hover:border-amber-500/80' },
      { label: '待提交评估', desc: `待提交 ${stats.value.transferred || 0} 条`, icon: ClipboardCheck, path: '/transfer?status=transferred', color: 'border-blue-500/40 hover:border-blue-500/80' },
    ]
  }
  if (r === '兽医') {
    return [
      { label: '待评估仔猪', desc: `待评估 ${stats.value.pending_assessment || 0} 条`, icon: ClipboardCheck, path: '/assessment?status=pending_assessment', color: 'border-orange-500/40 hover:border-orange-500/80' },
      { label: '评估历史', desc: `已评估 ${stats.value.assessed || 0} 条`, icon: Eye, path: '/assessment', color: 'border-blue-500/40 hover:border-blue-500/80' },
    ]
  }
  return [
    { label: '待审批淘汰', desc: `待审批 ${stats.value.pending_approval || 0} 条`, icon: FileText, path: '/assessment?status=pending_approval', color: 'border-purple-500/40 hover:border-purple-500/80' },
    { label: '全场转栏记录', desc: `共 ${stats.value.totalTransfers || 0} 条`, icon: Eye, path: '/transfer', color: 'border-slate-500/40 hover:border-slate-500/80' },
    { label: '操作日志', desc: '查看所有操作记录', icon: FileText, path: '/log', color: 'border-amber-500/40 hover:border-amber-500/80' },
  ]
})

const overdueCount = computed(() => stats.value.overdueMyTasks || 0)

onMounted(fetchData)

watch(() => auth.isLoggedIn, (val) => {
  if (val) fetchData()
})

async function fetchData() {
  if (!auth.isLoggedIn) return
  loading.value = true
  try {
    const res = await api.getStats(auth.role!)
    const data = res.data || res
    stats.value = data

    const logRes = await api.getLogs({ role: auth.role!, page: 1, pageSize: 5 })
    recentActions.value = (logRes.data?.list || logRes.list || []).slice(0, 5)

    if (auth.role === '繁育员') {
      const tRes = await api.getTransfers({ status: 'pending_transfer', pageSize: 50 })
      const list = tRes.data?.list || tRes.list || []
      overdueItems.value = tagOverdueItems(list.filter((t: any) => t.isOverdue), 'transfer')
    } else if (auth.role === '兽医') {
      const aRes = await api.getAssessments({ status: 'pending_assessment', pageSize: 50 })
      const list = aRes.data?.list || aRes.list || []
      overdueItems.value = tagOverdueItems(list.filter((a: any) => a.isOverdue), 'assessment')
    } else if (auth.role === '场长') {
      const aRes = await api.getAssessments({ status: 'pending_approval', pageSize: 50 })
      const list = aRes.data?.list || aRes.list || []
      overdueItems.value = tagOverdueItems(list.filter((a: any) => a.isOverdue), 'assessment')
    }
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e)
  } finally {
    loading.value = false
  }
}

function goTransferDetail(id: number) {
  router.push(`/transfer/${id}`)
}

function goAssessmentDetail(id: number) {
  router.push(`/assessment/${id}`)
}
</script>

<template>
  <Login v-if="!auth.isLoggedIn" />
  <div v-else class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-slate-100">工作台</h2>
      <p class="text-sm text-slate-500 mt-1">欢迎回来，{{ auth.name }}</p>
    </div>

    <div
      v-if="overdueCount > 0"
      class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
    >
      <AlertTriangle :size="20" class="text-red-400 shrink-0 mt-0.5" />
      <div class="flex-1">
        <div class="text-sm font-medium text-red-300">您有 {{ overdueCount }} 项超时任务</div>
        <div class="text-xs text-red-400/80 mt-1">请尽快处理，避免影响后续流程</div>
        <div v-if="overdueItems.length > 0" class="mt-3 space-y-2">
          <div
            v-for="item in overdueItems.slice(0, 3)"
            :key="item.id"
            class="flex items-center gap-3 bg-red-500/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-500/20 transition-colors"
            @click="item.type === 'transfer' ? goTransferDetail(item.id) : goAssessmentDetail(item.id)"
          >
            <span class="text-sm text-red-200">{{ item.ear_tag }}</span>
            <StatusBadge :status="item.status" />
            <span class="text-xs text-red-400 ml-auto">已超时</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-medium text-slate-400 mb-3">处理入口</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="entry in roleEntries"
          :key="entry.label"
          :class="[
            'card border cursor-pointer transition-all duration-200 hover:shadow-lg',
            entry.color
          ]"
          @click="router.push(entry.path)"
        >
          <div class="flex items-center gap-3 mb-2">
            <component :is="entry.icon" :size="20" class="text-slate-300" />
            <span class="text-sm font-semibold text-slate-200">{{ entry.label }}</span>
          </div>
          <p class="text-xs text-slate-500">{{ entry.desc }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card text-center">
        <div class="text-2xl font-bold text-amber-400">{{ stats.pending_transfer || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">待转栏</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-blue-400">{{ stats.transferred || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">已转栏</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-orange-400">{{ stats.pending_assessment || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">待评估</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-purple-400">{{ stats.pending_approval || 0 }}</div>
        <div class="text-xs text-slate-500 mt-1">待审批</div>
      </div>
    </div>

    <div class="card">
      <h3 class="text-sm font-medium text-slate-300 mb-4">最近动态</h3>
      <div v-if="loading" class="text-sm text-slate-500 py-4 text-center">加载中...</div>
      <div v-else-if="recentActions.length === 0" class="text-sm text-slate-500 py-4 text-center">暂无动态</div>
      <div v-else class="space-y-3">
        <div
          v-for="(item, idx) in recentActions"
          :key="idx"
          class="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0"
        >
          <Clock :size="14" class="text-slate-500 shrink-0" />
          <span class="text-sm text-slate-300 flex-1">{{ item.detail || item.action }}</span>
          <RoleBadge :role="item.operator_role" />
          <span class="text-xs text-slate-600">{{ item.createdAt || item.created_at }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
