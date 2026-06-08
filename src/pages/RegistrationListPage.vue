<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <button
        class="px-4 py-1.5 rounded-full text-sm font-medium font-heading transition-all duration-200 border"
        :class="myResponsibility
          ? 'bg-accent/15 text-accent border-accent/50 shadow-[0_0_12px_rgba(0,255,136,0.2)]'
          : 'text-text-secondary border-border-card hover:text-text-primary hover:border-text-secondary'"
        @click="myResponsibility = !myResponsibility"
      >
        我的责任
      </button>
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

    <div v-if="filteredRegistrations.length === 0" class="text-text-secondary text-sm py-16 text-center">
      暂无报名记录
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <router-link
        v-for="reg in filteredRegistrations"
        :key="reg.id"
        :to="`/registrations/${reg.id}`"
        class="card-hover p-4 relative block"
        :class="urgencyBorderClass(reg)"
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

        <div class="pl-3 relative">
          <div class="flex items-start justify-between mb-2">
            <div class="min-w-0 flex-1">
              <h3 class="font-heading text-base font-semibold text-text-primary truncate">{{ reg.event_name }}</h3>
              <p class="text-sm text-text-secondary">{{ reg.team_name }}</p>
            </div>
            <StatusBadge :status="reg.status" />
          </div>

          <div class="flex items-center gap-2 mb-2">
            <span
              class="text-xs font-heading font-medium px-2 py-0.5 rounded"
              :style="{ color: ROLE_COLORS[reg.current_owner_role], backgroundColor: `${ROLE_COLORS[reg.current_owner_role]}18`, border: `1px solid ${ROLE_COLORS[reg.current_owner_role]}35` }"
            >
              当前责任: {{ reg.current_owner_role }}
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
      </router-link>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { STATUS_LABELS, STATUS_COLORS, ROLE_COLORS, getUrgencyLevel, urgencySortWeight } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import type { Registration } from '@/types'

const store = useAppStore()
const router = useRouter()
const activeTab = ref('all')
const myResponsibility = ref(false)
const showNewRegDialog = ref(false)
const submitting = ref(false)

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
})

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
  return [...list].sort((a, b) => urgencySortWeight(a) - urgencySortWeight(b))
})

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
