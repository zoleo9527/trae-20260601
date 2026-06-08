<template>
  <div v-if="!allocation" class="flex items-center justify-center py-20">
    <p class="text-text-secondary">加载中...</p>
  </div>

  <div v-else class="space-y-6">
    <div class="flex items-center gap-3">
      <button class="text-text-secondary hover:text-accent transition-colors" @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h2 class="font-heading text-xl font-bold text-text-primary">分配详情</h2>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-heading"
        :style="allocStatusStyle"
      >
        {{ allocStatusLabel }}
      </span>
    </div>

    <div class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">关联报名</h3>
      <div v-if="allocation.registration" class="space-y-3">
        <div class="flex items-center gap-3">
          <router-link
            :to="`/registrations/${allocation.registration_id}`"
            class="text-accent hover:underline text-sm font-heading font-semibold"
          >
            {{ allocation.registration.event_name }}
          </router-link>
          <span class="text-text-secondary text-sm">·</span>
          <span class="text-text-secondary text-sm">{{ allocation.registration.team_name }}</span>
          <StatusBadge :status="allocation.registration.status" />
        </div>
        <div class="grid grid-cols-3 gap-3 text-xs">
          <div>
            <span class="text-text-secondary">参赛人数:</span>
            <span class="text-text-primary ml-1">{{ allocation.registration.player_count }}人</span>
          </div>
          <div>
            <span class="text-text-secondary">设备要求:</span>
            <span class="text-text-primary ml-1">{{ allocation.registration.device_requirement || '无' }}</span>
          </div>
          <div>
            <span class="text-text-secondary">提交人:</span>
            <span class="text-text-primary ml-1">{{ allocation.registration.submitted_by }}</span>
          </div>
        </div>
      </div>
      <router-link
        v-else
        :to="`/registrations/${allocation.registration_id}`"
        class="text-accent hover:underline text-sm"
      >
        查看报名 #{{ allocation.registration_id.slice(0, 8) }}
      </router-link>
    </div>

    <div class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">分配座位</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="seat in allocation.seat_details || []"
          :key="seat.id"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent text-sm font-heading"
        >
          <Monitor class="w-3.5 h-3.5" />
          {{ seat.seat_number }}
          <span class="text-text-secondary text-xs ml-1">({{ seat.zone }}区)</span>
        </span>
        <span v-if="!allocation.seat_details?.length" class="text-text-secondary text-sm">
          {{ allocation.seat_ids }}
        </span>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">分配信息</h3>
      <div class="grid grid-cols-3 gap-6">
        <div>
          <p class="text-xs text-text-secondary mb-1">分配人</p>
          <p class="text-sm text-text-primary">{{ allocation.allocated_by }}</p>
        </div>
        <div>
          <p class="text-xs text-text-secondary mb-1">分配时间</p>
          <p class="text-sm text-text-primary">{{ formatDateTime(allocation.allocated_at) }}</p>
        </div>
        <div>
          <p class="text-xs text-text-secondary mb-1">确认人</p>
          <p class="text-sm text-text-primary">{{ allocation.confirmed_by || '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-text-secondary mb-1">确认时间</p>
          <p class="text-sm text-text-primary">{{ allocation.confirmed_at ? formatDateTime(allocation.confirmed_at) : '—' }}</p>
        </div>
        <div v-if="allocation.conflict_reason" class="col-span-2">
          <p class="text-xs text-text-secondary mb-1">冲突原因</p>
          <div class="flex items-start gap-2 p-3 rounded bg-alert/5 border border-alert/20">
            <AlertTriangle class="w-4 h-4 text-alert shrink-0 mt-0.5" />
            <p class="text-sm text-alert">{{ allocation.conflict_reason }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="canConfirm || canRelease" class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">操作</h3>
      <div class="flex items-start gap-4">
        <button v-if="canConfirm" class="btn-primary" @click="confirmAllocation">确认分配</button>
        <button v-if="canRelease" class="btn-danger" @click="releaseAllocation">释放座位</button>
        <div class="flex-1">
          <textarea
            v-model="actionNote"
            class="input-dark min-h-[60px] resize-none"
            placeholder="请输入操作备注（必填）"
          />
        </div>
      </div>
    </div>

    <div v-if="handoverLogs.length > 0" class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">关联交接记录</h3>
      <div class="relative max-h-[400px] overflow-y-auto pr-2">
        <div
          v-for="(log, idx) in [...handoverLogs].reverse()"
          :key="log.id"
          class="relative pl-8 pb-5"
        >
          <div
            class="absolute left-[11px] top-2 w-3 h-3 rounded-full z-10 ring-2 ring-bg-primary"
            :style="{ backgroundColor: roleColor(log.operator_role) }"
          />
          <div
            v-if="idx < [...handoverLogs].reverse().length - 1"
            class="absolute left-[16px] top-5 w-0.5 bg-border-card"
            :style="{ height: 'calc(100% - 16px)' }"
          />
          <div
            class="rounded-lg p-3"
            :class="log.note_type === 'dispute' || log.note_type === 'urgent' ? 'bg-alert/5 border border-alert/15' : 'bg-bg-primary/50'"
          >
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <span class="text-xs font-semibold" :style="{ color: roleColor(log.operator_role) }">
                {{ log.operator_role }}
              </span>
              <span class="text-xs text-text-secondary">{{ log.operator_name }}</span>
              <NoteTypeTag :type="log.note_type" />
              <div
                v-if="log.from_role && log.to_role"
                class="flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-bg-card border border-border-card"
              >
                <span class="text-xs font-medium" :style="{ color: roleColor(log.from_role) }">{{ log.from_role }}</span>
                <span class="text-xs text-accent">→</span>
                <span class="text-xs font-medium" :style="{ color: roleColor(log.to_role) }">{{ log.to_role }}</span>
              </div>
              <span class="text-xs text-text-secondary ml-auto whitespace-nowrap">{{ formatDateTime(log.created_at) }}</span>
            </div>
            <p class="text-sm text-accent font-medium">{{ log.action }}</p>
            <p v-if="log.note" class="text-sm text-text-secondary mt-1">{{ log.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Monitor, AlertTriangle } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { SeatAllocation, HandoverLog } from '@/types'
import { ROLE_COLORS } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import NoteTypeTag from '@/components/NoteTypeTag.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const allocation = ref<SeatAllocation | null>(null)
const handoverLogs = ref<HandoverLog[]>([])
const actionNote = ref('')

onMounted(async () => {
  const id = route.params.id as string
  allocation.value = await store.fetchAllocation(id)
  if (allocation.value) {
    try {
      const res = await fetch(`/api/handover-logs/${allocation.value.registration_id}`)
      const data = await res.json()
      if (data.success) {
        handoverLogs.value = data.data
      }
    } catch {
      handoverLogs.value = []
    }
  }
})

function goBack() {
  if (allocation.value) {
    router.push(`/registrations/${allocation.value.registration_id}`)
  } else {
    router.push('/seats')
  }
}

const allocStatusLabel = computed(() => {
  switch (allocation.value?.status) {
    case 'pending': return '待确认'
    case 'confirmed': return '已确认'
    case 'released': return '已释放'
    default: return ''
  }
})

const allocStatusStyle = computed(() => {
  let color = '#8B949E'
  switch (allocation.value?.status) {
    case 'pending': color = '#FFCC00'; break
    case 'confirmed': color = '#00FF88'; break
    case 'released': color = '#8B949E'; break
  }
  return {
    backgroundColor: `${color}20`,
    color,
    border: `1px solid ${color}40`,
  }
})

const canConfirm = computed(() => {
  if (!allocation.value) return false
  return allocation.value.status === 'pending' && (store.currentRole === '赛事运营' || store.currentRole === '店长')
})

const canRelease = computed(() => {
  if (!allocation.value) return false
  return allocation.value.status === 'pending' && (store.currentRole === '网管' || store.currentRole === '店长')
})

async function confirmAllocation() {
  if (!allocation.value || !actionNote.value.trim()) {
    alert('请输入操作备注')
    return
  }
  const success = await store.updateAllocation(allocation.value.id, {
    status: 'confirmed',
    confirmed_by: store.currentName,
  })
  if (success) {
    await store.addNote(allocation.value.registration_id, 'normal', `确认座位分配: ${actionNote.value}`)
    router.push(`/registrations/${allocation.value.registration_id}`)
  }
}

async function releaseAllocation() {
  if (!allocation.value || !actionNote.value.trim()) {
    alert('请输入操作备注')
    return
  }
  const success = await store.updateAllocation(allocation.value.id, {
    status: 'released',
  })
  if (success) {
    await store.addNote(allocation.value.registration_id, 'dispute', `释放座位: ${actionNote.value}`)
    router.push(`/registrations/${allocation.value.registration_id}`)
  }
}

function roleColor(role: string): string {
  return ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? '#8B949E'
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>
