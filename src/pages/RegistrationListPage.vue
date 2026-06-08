<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="px-4 py-1.5 rounded-full text-sm font-medium font-heading transition-all duration-200 border"
          :class="myResponsibility
            ? 'bg-accent/15 text-accent border-accent/50 shadow-[0_0_12px_rgba(0,255,136,0.2)]'
            : 'text-text-secondary border-border-card hover:text-text-primary hover:border-text-secondary'"
          @click="myResponsibility = !myResponsibility"
        >
          我的责任
        </button>
        <button
          class="px-4 py-1.5 rounded-full text-sm font-medium font-heading transition-all duration-200 border"
          :class="selectMode
            ? 'bg-accent/15 text-accent border-accent/50'
            : 'text-text-secondary border-border-card hover:text-text-primary hover:border-text-secondary'"
          @click="toggleSelectMode"
        >
          <span class="flex items-center gap-1.5">
            <CheckSquare class="w-3.5 h-3.5" />
            {{ selectMode ? '退出多选' : '多选操作' }}
          </span>
        </button>
      </div>
      <button class="btn-primary text-sm" @click="showNewRegDialog = true">
        + 提交报名
      </button>
    </div>

    <div
      v-if="myResponsibility && myPendingCount > 0"
      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-warning/40 bg-warning/10"
    >
      <div class="w-2 h-2 rounded-full bg-warning animate-pulse" />
      <span class="text-sm font-medium text-warning font-heading">
        你有 {{ myPendingCount }} 项待处理事项
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-bg-card border border-border-card">
      <div class="flex items-center gap-1.5">
        <Filter class="w-3.5 h-3.5 text-text-secondary" />
        <span class="text-xs text-text-secondary font-medium">筛选</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-for="opt in roleFilterOptions"
          :key="opt.value"
          class="px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 border"
          :class="roleFilter === opt.value
            ? 'text-text-primary border-accent/30 bg-accent/10'
            : 'text-text-secondary border-transparent hover:text-text-primary'"
          @click="roleFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <div class="w-px h-4 bg-border-card" />
      <div class="flex items-center gap-1">
        <button
          v-for="opt in urgencyFilterOptions"
          :key="opt.value"
          class="px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 border"
          :class="urgencyFilter === opt.value
            ? `${opt.activeClass} border-current/30`
            : 'text-text-secondary border-transparent hover:text-text-primary'"
          @click="urgencyFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <div class="w-px h-4 bg-border-card" />
      <div class="flex items-center gap-1">
        <button
          v-for="opt in timeFilterOptions"
          :key="opt.value"
          class="px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 border"
          :class="timeFilter === opt.value
            ? 'text-text-primary border-accent/30 bg-accent/10'
            : 'text-text-secondary border-transparent hover:text-text-primary'"
          @click="timeFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <button
        v-if="hasActiveFilters"
        class="ml-1 text-xs text-text-secondary hover:text-alert transition-colors"
        @click="clearFilters"
      >
        清除筛选
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg border"
      :class="pressureSummaryClass"
    >
      <div class="flex items-center gap-1.5">
        <Activity class="w-3.5 h-3.5" />
        <span class="text-xs font-heading font-semibold text-text-primary">压力小结</span>
      </div>
      <div class="flex items-center gap-4 ml-2">
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-alert" />
          <span class="text-xs text-text-secondary">超时</span>
          <span class="text-xs font-heading font-bold text-alert">{{ pressureSummary.overdue }}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-warning" />
          <span class="text-xs text-text-secondary">缺座</span>
          <span class="text-xs font-heading font-bold text-warning">{{ pressureSummary.seatGap }}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-[#FF9500]" />
          <span class="text-xs text-text-secondary">争议</span>
          <span class="text-xs font-heading font-bold text-[#FF9500]">{{ pressureSummary.disputes }}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-accent" />
          <span class="text-xs text-text-secondary">共计</span>
          <span class="text-xs font-heading font-bold text-accent">{{ filteredRegistrations.length }}</span>
        </div>
      </div>
    </div>

    <div class="flex gap-2 border-b border-border-card pb-3 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
        :class="activeTab === tab.value
          ? 'bg-accent/15 text-accent border border-accent/30'
          : 'text-text-secondary hover:text-text-primary border border-transparent'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="ml-1 text-xs opacity-70">({{ tab.count }})</span>
      </button>
    </div>

    <div v-if="selectMode && selectedIds.size > 0" class="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
      <span class="text-sm font-heading font-semibold text-accent">已选 {{ selectedIds.size }} 项</span>
      <button class="text-xs text-text-secondary hover:text-text-primary" @click="selectedIds.clear()">取消全选</button>
      <div class="flex-1" />
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 rounded text-xs font-medium border border-alert/30 text-alert hover:bg-alert/10 transition-colors"
          :disabled="batchLoading"
          @click="batchEscalate"
        >
          <span class="flex items-center gap-1">
            <ArrowUpCircle class="w-3 h-3" />
            批量升级店长
          </span>
        </button>
        <button
          class="px-3 py-1.5 rounded text-xs font-medium border border-[#FF9500]/30 text-[#FF9500] hover:bg-[#FF9500]/10 transition-colors"
          :disabled="batchLoading"
          @click="showBatchNoteDialog = true"
        >
          <span class="flex items-center gap-1">
            <MessageSquare class="w-3 h-3" />
            批量补充备注
          </span>
        </button>
        <button
          class="px-3 py-1.5 rounded text-xs font-medium border border-warning/30 text-warning hover:bg-warning/10 transition-colors"
          :disabled="batchLoading"
          @click="batchReleaseSeats"
        >
          <span class="flex items-center gap-1">
            <Unlock class="w-3 h-3" />
            批量释放座位
          </span>
        </button>
      </div>
    </div>

    <div v-if="filteredRegistrations.length === 0" class="text-text-secondary text-sm py-16 text-center">
      暂无报名记录
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-for="reg in filteredRegistrations"
        :key="reg.id"
        class="card-hover p-4 relative"
        :class="[urgencyBorderClass(reg), selectMode ? 'cursor-pointer' : '']"
        @click="selectMode ? toggleSelect(reg.id) : null"
      >
        <div
          v-if="getUrgencyLevel(reg) === 'overdue'"
          class="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          :style="{ boxShadow: 'inset 0 0 0 2px rgba(255,59,48,0.6), 0 0 20px rgba(255,59,48,0.15)' }"
        />
        <div
          v-else-if="getUrgencyLevel(reg) === 'critical'"
          class="absolute inset-0 rounded-lg pointer-events-none"
          :style="{ boxShadow: 'inset 0 0 0 1px rgba(255,149,0,0.4), 0 0 12px rgba(255,149,0,0.1)' }"
        />

        <div
          class="absolute top-0 left-0 w-1 h-full rounded-l-lg"
          :style="{ backgroundColor: urgencyStripeColor(reg) }"
        />

        <div v-if="selectMode" class="absolute top-3 left-3 z-10">
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
            :class="selectedIds.has(reg.id)
              ? 'bg-accent border-accent'
              : 'border-text-secondary/40 hover:border-accent'"
          >
            <CheckSquare v-if="selectedIds.has(reg.id)" class="w-3 h-3 text-bg-primary" />
          </div>
        </div>

        <div class="pl-3 relative" :class="selectMode ? 'ml-6' : ''">
          <div class="flex items-start justify-between mb-2">
            <div class="min-w-0 flex-1">
              <router-link
                v-if="!selectMode"
                :to="`/registrations/${reg.id}`"
                class="font-heading text-base font-semibold text-text-primary truncate hover:text-accent transition-colors block"
              >
                {{ reg.event_name }}
              </router-link>
              <h3 v-else class="font-heading text-base font-semibold text-text-primary truncate">
                {{ reg.event_name }}
              </h3>
              <p class="text-sm text-text-secondary">{{ reg.team_name }}</p>
            </div>
            <StatusBadge :status="reg.status" />
          </div>

          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span
              class="text-xs font-heading font-medium px-2 py-0.5 rounded"
              :style="{ color: ROLE_COLORS[reg.current_owner_role], backgroundColor: `${ROLE_COLORS[reg.current_owner_role]}18`, border: `1px solid ${ROLE_COLORS[reg.current_owner_role]}35` }"
            >
              {{ reg.current_owner_role }}
            </span>
            <span
              v-if="reg.available_seats && reg.available_seats.gap > 0"
              class="text-xs font-heading font-medium px-2 py-0.5 rounded text-alert bg-alert/10 border border-alert/25"
            >
              缺{{ reg.available_seats.gap }}座
            </span>
            <span
              v-if="hasRecentDispute(reg)"
              class="text-xs font-heading font-medium px-2 py-0.5 rounded text-[#FF9500] bg-[#FF9500]/10 border border-[#FF9500]/25"
            >
              争议
            </span>
          </div>

          <div class="flex items-center gap-4 text-xs text-text-secondary mb-3">
            <span>{{ reg.player_count }}人</span>
            <span v-if="reg.device_requirement">{{ reg.device_requirement }}</span>
            <span>{{ reg.submitted_by }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-text-secondary">
              {{ formatDate(reg.submitted_at) }}
            </span>
            <div class="flex items-center gap-1">
              <Clock class="w-3 h-3 text-text-secondary" />
              <CountdownTimer :deadline="reg.deadline_at" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showNewRegDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="showNewRegDialog = false"
    >
      <div class="card p-6 w-[520px] border-accent/30 glow-green">
        <h3 class="font-heading text-lg font-semibold text-accent mb-4">提交赛事报名</h3>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-text-secondary mb-1 block">赛事名称 *</label>
            <input v-model="newReg.eventName" class="input-dark" placeholder="例如：王者荣耀城市赛" />
          </div>
          <div>
            <label class="text-xs text-text-secondary mb-1 block">队伍名称 *</label>
            <input v-model="newReg.teamName" class="input-dark" placeholder="例如：星辰战队" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-text-secondary mb-1 block">参赛人数 *</label>
              <input v-model.number="newReg.playerCount" type="number" min="1" class="input-dark" placeholder="人数" />
            </div>
            <div>
              <label class="text-xs text-text-secondary mb-1 block">SLA(分钟)</label>
              <input v-model.number="newReg.slaMinutes" type="number" min="5" class="input-dark" placeholder="15" />
            </div>
          </div>
          <div>
            <label class="text-xs text-text-secondary mb-1 block">设备要求</label>
            <input v-model="newReg.deviceRequirement" class="input-dark" placeholder="例如：10台高配机·B区连坐" />
          </div>
          <div>
            <label class="text-xs text-text-secondary mb-1 block">备注 *</label>
            <textarea v-model="newReg.note" class="input-dark min-h-[60px] resize-none" placeholder="报名说明，客户特殊要求等" />
          </div>
          <div class="p-3 rounded bg-warning/5 border border-warning/20 text-xs text-warning">
            当前身份：{{ store.currentRole }}/{{ store.currentName }} — 提交后将自动分配给赛事运营确认
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button class="px-4 py-2 rounded text-text-secondary hover:text-text-primary transition-colors" @click="showNewRegDialog = false">取消</button>
          <button
            class="btn-primary"
            :disabled="!newReg.eventName || !newReg.teamName || !newReg.playerCount || !newReg.note || submitting"
            @click="submitNewReg"
          >
            {{ submitting ? '提交中...' : '提交报名' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showBatchNoteDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="showBatchNoteDialog = false"
    >
      <div class="card p-6 w-[480px] border-[#FF9500]/30">
        <h3 class="font-heading text-lg font-semibold text-[#FF9500] mb-4">批量补充交接备注</h3>
        <p class="text-sm text-text-secondary mb-4">为 {{ selectedIds.size }} 条报名添加备注</p>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-text-secondary mb-1 block">备注类型 *</label>
            <select v-model="batchNoteType" class="input-dark">
              <option value="normal">正常</option>
              <option value="urgent">紧急</option>
              <option value="dispute">争议</option>
              <option value="supplement">补充</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-text-secondary mb-1 block">备注内容 *</label>
            <textarea v-model="batchNoteContent" class="input-dark min-h-[80px] resize-none" placeholder="输入交接备注..." />
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button class="px-4 py-2 rounded text-text-secondary hover:text-text-primary transition-colors" @click="showBatchNoteDialog = false">取消</button>
          <button
            class="px-4 py-2 rounded text-sm font-medium bg-[#FF9500] text-bg-primary hover:bg-[#FF9500]/80 transition-colors"
            :disabled="!batchNoteContent || batchLoading"
            @click="executeBatchNotes"
          >
            {{ batchLoading ? '处理中...' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Clock, Filter, Activity, CheckSquare, ArrowUpCircle, MessageSquare, Unlock } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { STATUS_COLORS, ROLE_COLORS, getUrgencyLevel, urgencySortWeight } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import type { Registration, Role } from '@/types'

const store = useAppStore()
const router = useRouter()
const route = useRoute()

const activeTab = ref('all')
const myResponsibility = ref(false)
const showNewRegDialog = ref(false)
const submitting = ref(false)
const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const batchLoading = ref(false)
const showBatchNoteDialog = ref(false)
const batchNoteType = ref<'normal' | 'urgent' | 'dispute' | 'supplement'>('supplement')
const batchNoteContent = ref('')

const roleFilter = ref<string>('all')
const urgencyFilter = ref<string>('all')
const timeFilter = ref<string>('all')

const newReg = reactive({
  eventName: '',
  teamName: '',
  playerCount: 6,
  deviceRequirement: '',
  note: '',
  slaMinutes: 15,
})

onMounted(async () => {
  await store.fetchRegistrations()
  applyQueryParams()
})

function applyQueryParams() {
  if (route.query.role && typeof route.query.role === 'string') {
    const validRoles: string[] = ['网管', '赛事运营', '店长']
    if (validRoles.includes(route.query.role)) {
      roleFilter.value = route.query.role
    }
  }
  if (route.query.urgency && typeof route.query.urgency === 'string') {
    const valid = ['overdue', 'critical', 'normal']
    if (valid.includes(route.query.urgency)) {
      urgencyFilter.value = route.query.urgency
    }
  }
  if (route.query.status && typeof route.query.status === 'string') {
    activeTab.value = route.query.status
  }
}

const roleFilterOptions = [
  { value: 'all', label: '全部角色' },
  { value: '网管', label: '网管' },
  { value: '赛事运营', label: '赛事运营' },
  { value: '店长', label: '店长' },
]

const urgencyFilterOptions = [
  { value: 'all', label: '全部', activeClass: 'text-text-primary bg-accent/10' },
  { value: 'overdue', label: '超时', activeClass: 'text-alert bg-alert/10' },
  { value: 'critical', label: '临界', activeClass: 'text-warning bg-warning/10' },
  { value: 'normal', label: '普通', activeClass: 'text-accent bg-accent/10' },
]

const timeFilterOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今日' },
  { value: '24h', label: '24小时内' },
]

const hasActiveFilters = computed(() => {
  return roleFilter.value !== 'all' || urgencyFilter.value !== 'all' || timeFilter.value !== 'all'
})

function clearFilters() {
  roleFilter.value = 'all'
  urgencyFilter.value = 'all'
  timeFilter.value = 'all'
}

const tabs = computed(() => {
  const source = myResponsibility.value
    ? store.registrations.filter(r => r.current_owner_role === store.currentRole)
    : store.registrations
  const counts: Record<string, number> = { all: source.length }
  for (const reg of source) {
    counts[reg.status] = (counts[reg.status] || 0) + 1
  }
  return [
    { value: 'all', label: '全部', count: counts.all || 0 },
    { value: 'pending', label: '待处理', count: counts.pending || 0 },
    { value: 'confirmed', label: '已确认', count: counts.confirmed || 0 },
    { value: 'seating', label: '分配中', count: counts.seating || 0 },
    { value: 'completed', label: '已完成', count: counts.completed || 0 },
    { value: 'rejected', label: '已驳回', count: counts.rejected || 0 },
    { value: 'escalated', label: '已升级', count: counts.escalated || 0 },
  ]
})

const myPendingCount = computed(() => {
  return store.registrations.filter(
    r => r.current_owner_role === store.currentRole && r.status !== 'completed' && r.status !== 'rejected'
  ).length
})

const filteredRegistrations = computed(() => {
  let list = store.registrations

  if (myResponsibility.value) {
    list = list.filter(r => r.current_owner_role === store.currentRole)
  }

  if (activeTab.value !== 'all') {
    list = list.filter(r => r.status === activeTab.value)
  }

  if (roleFilter.value !== 'all') {
    list = list.filter(r => r.current_owner_role === roleFilter.value)
  }

  if (urgencyFilter.value !== 'all') {
    list = list.filter(r => {
      const level = getUrgencyLevel(r)
      if (urgencyFilter.value === 'overdue') return level === 'overdue'
      if (urgencyFilter.value === 'critical') return level === 'overdue' || level === 'critical'
      if (urgencyFilter.value === 'normal') return level === 'normal' || level === 'warning'
      return true
    })
  }

  if (timeFilter.value !== 'all') {
    const now = new Date()
    list = list.filter(r => {
      const submitted = new Date(r.submitted_at)
      if (timeFilter.value === 'today') {
        return submitted.getFullYear() === now.getFullYear() &&
          submitted.getMonth() === now.getMonth() &&
          submitted.getDate() === now.getDate()
      }
      if (timeFilter.value === '24h') {
        return now.getTime() - submitted.getTime() < 24 * 60 * 60 * 1000
      }
      return true
    })
  }

  return [...list].sort((a, b) => urgencySortWeight(a) - urgencySortWeight(b))
})

const pressureSummary = computed(() => {
  const list = filteredRegistrations.value
  let overdue = 0
  let seatGap = 0
  let disputes = 0

  for (const reg of list) {
    const level = getUrgencyLevel(reg)
    if (level === 'overdue' || level === 'critical') overdue++
    if (reg.available_seats && reg.available_seats.gap > 0) seatGap++
    if (hasRecentDispute(reg)) disputes++
  }

  return { overdue, seatGap, disputes, total: list.length }
})

const pressureSummaryClass = computed(() => {
  const s = pressureSummary.value
  if (s.overdue > 0) return 'border-alert/30 bg-alert/5'
  if (s.seatGap > 0 || s.disputes > 0) return 'border-warning/30 bg-warning/5'
  return 'border-accent/20 bg-accent/5'
})

function hasRecentDispute(reg: Registration): boolean {
  if (!reg.handover_logs) return false
  return reg.handover_logs.some(log => log.note_type === 'dispute')
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) {
    selectedIds.value.clear()
  }
}

function toggleSelect(id: string) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

async function batchEscalate() {
  if (selectedIds.value.size === 0) return
  batchLoading.value = true
  try {
    const res = await fetch('/api/registrations/batch/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.from(selectedIds.value),
        operator_role: store.currentRole,
        operator_name: store.currentName,
        reason: `由${store.currentRole}/${store.currentName}批量升级到店长处理`,
      }),
    })
    const data = await res.json()
    if (data.success) {
      selectedIds.value.clear()
      await store.fetchRegistrations()
      await store.fetchStats()
    }
  } finally {
    batchLoading.value = false
  }
}

async function executeBatchNotes() {
  if (selectedIds.value.size === 0 || !batchNoteContent.value) return
  batchLoading.value = true
  try {
    const res = await fetch('/api/registrations/batch/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.from(selectedIds.value),
        operator_role: store.currentRole,
        operator_name: store.currentName,
        note_type: batchNoteType.value,
        note: batchNoteContent.value,
      }),
    })
    const data = await res.json()
    if (data.success) {
      showBatchNoteDialog.value = false
      batchNoteContent.value = ''
      batchNoteType.value = 'supplement'
      selectedIds.value.clear()
      await store.fetchRegistrations()
      await store.fetchStats()
    }
  } finally {
    batchLoading.value = false
  }
}

async function batchReleaseSeats() {
  if (selectedIds.value.size === 0) return
  batchLoading.value = true
  try {
    const res = await fetch('/api/registrations/batch/release-seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.from(selectedIds.value),
        operator_role: store.currentRole,
        operator_name: store.currentName,
        note: `由${store.currentRole}/${store.currentName}批量释放座位`,
      }),
    })
    const data = await res.json()
    if (data.success) {
      selectedIds.value.clear()
      await store.fetchRegistrations()
      await store.fetchStats()
    }
  } finally {
    batchLoading.value = false
  }
}

function urgencyBorderClass(reg: Registration): string {
  const level = getUrgencyLevel(reg)
  switch (level) {
    case 'overdue': return 'border-2 border-alert/60'
    case 'critical': return 'border border-warning/40'
    default: return 'border border-border-card'
  }
}

function urgencyStripeColor(reg: Registration): string {
  const level = getUrgencyLevel(reg)
  switch (level) {
    case 'overdue': return '#FF3B30'
    case 'critical': return '#FF9500'
    case 'warning': return '#FFCC00'
    default: return STATUS_COLORS[reg.status] ?? '#8B949E'
  }
}

async function submitNewReg() {
  submitting.value = true
  try {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: newReg.eventName,
        team_name: newReg.teamName,
        player_count: newReg.playerCount,
        device_requirement: newReg.deviceRequirement,
        submitted_by: `${store.currentRole}/${store.currentName}`,
        note: newReg.note,
        sla_minutes: newReg.slaMinutes,
      }),
    })
    const data = await res.json()
    if (data.success) {
      showNewRegDialog.value = false
      newReg.eventName = ''
      newReg.teamName = ''
      newReg.playerCount = 6
      newReg.deviceRequirement = ''
      newReg.note = ''
      newReg.slaMinutes = 15
      await store.fetchRegistrations()
      await store.fetchStats()
      router.push(`/registrations/${data.data.id}`)
    }
  } finally {
    submitting.value = false
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>
