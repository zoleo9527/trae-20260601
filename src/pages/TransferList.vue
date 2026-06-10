<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { Search, Plus, ArrowRight, AlertTriangle, Clock } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import RoleBadge from '@/components/RoleBadge.vue'
import Pagination from '@/components/Pagination.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const api = useApi()

const statusFilters = [
  { key: '', label: '全部' },
  { key: 'pending_transfer', label: '待转栏' },
  { key: 'transferred', label: '已转栏' },
  { key: 'pending_assessment', label: '待评估' },
  { key: 'pending_approval', label: '待审批' },
  { key: 'culled', label: '已淘汰' },
  { key: 'retained', label: '已留养' },
]

const activeFilter = ref('')
const searchQuery = ref('')
const transfers = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const pageSize = 10
const loading = ref(false)

function initFromQuery() {
  if (route.query.status) {
    activeFilter.value = route.query.status as string
  }
}

async function fetchTransfers() {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page: page.value, pageSize }
    if (activeFilter.value) params.status = activeFilter.value
    if (searchQuery.value) params.search = searchQuery.value
    const res = await api.getTransfers(params)
    transfers.value = res.data?.list || res.list || []
    total.value = res.data?.total || res.total || 0
  } catch {
    transfers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function setFilter(key: string) {
  activeFilter.value = key
  page.value = 1
  fetchTransfers()
}

initFromQuery()
onMounted(fetchTransfers)
watch(page, fetchTransfers)
watch(() => route.query.status, (val) => {
  if (val) {
    activeFilter.value = val as string
    fetchTransfers()
  }
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-slate-100">转栏管理</h2>
      <button
        v-if="auth.role === '繁育员'"
        class="btn-primary flex items-center gap-2"
        @click="router.push('/transfer/new')"
      >
        <Plus :size="16" />
        <span>新建转栏</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in statusFilters"
          :key="f.key"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeFilter === f.key
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
          ]"
          @click="setFilter(f.key)"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="relative flex-1 min-w-[200px] max-w-xs">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索耳号..."
          class="input-field pl-9 text-sm"
          @keyup.enter="fetchTransfers"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">加载中...</div>
    <div v-else-if="transfers.length === 0" class="text-center py-12 text-slate-500">暂无转栏记录</div>
    <div v-else class="space-y-3">
      <div
        v-for="item in transfers"
        :key="item.id"
        :class="[
          'card cursor-pointer hover:border-slate-600 transition-colors flex items-center gap-4',
          item.isOverdue ? 'border-red-500/30' : ''
        ]"
        @click="router.push(`/transfer/${item.id}`)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <span class="text-sm font-semibold text-slate-200">{{ item.ear_tag }}</span>
            <StatusBadge :status="item.status" />
            <span
              v-if="item.isOverdue"
              class="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full"
            >
              <AlertTriangle :size="10" /> 超时
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-500">
            <span>{{ item.breed }}</span>
            <span>{{ item.age_days }}日龄</span>
            <span>{{ item.from_pen }} → {{ item.to_pen }}</span>
          </div>
          <div v-if="item.nextAction && item.nextResponsible" class="mt-1.5 flex items-center gap-2 text-xs">
            <span class="text-slate-500">下一步:</span>
            <span class="text-slate-400">{{ item.nextResponsible }}「{{ item.nextAction }}」</span>
            <span v-if="item.hoursLeft !== null && !item.isOverdue" class="text-amber-500">
              (剩余{{ item.hoursLeft < 1 ? Math.round(item.hoursLeft * 60) + '分钟' : Math.round(item.hoursLeft) + '小时' }})
            </span>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs text-slate-500">{{ item.operator }}</div>
          <div class="text-xs text-slate-600 mt-0.5">{{ item.created_at }}</div>
        </div>
        <ArrowRight :size="16" class="text-slate-600 shrink-0" />
      </div>
    </div>

    <Pagination v-model:current="page" :total="total" :page-size="pageSize" />
  </div>
</template>
