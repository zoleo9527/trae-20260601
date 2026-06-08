<template>
  <div class="space-y-6">
    <div v-if="returnToRegistration" class="card p-4 border-accent/30 glow-green">
      <div class="flex items-center gap-3">
        <ArrowLeft class="w-5 h-5 text-accent cursor-pointer hover:text-accent/70 transition-colors" @click="router.push(`/registrations/${returnToRegistration}`)" />
        <div class="flex-1">
          <p class="text-sm text-accent font-heading font-semibold">为报名分配座位</p>
          <p class="text-xs text-text-secondary">
            {{ targetRegistration?.event_name }} · {{ targetRegistration?.team_name }} · 需要 {{ targetRegistration?.player_count }} 台
          </p>
        </div>
        <span v-if="targetRegistration" class="text-xs px-2 py-1 rounded bg-accent/10 border border-accent/30 text-accent font-heading">
          已选 {{ selectedSeatIds.length }} / {{ targetRegistration.player_count }} 台
        </span>
      </div>
    </div>

    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-heading text-lg font-semibold text-accent flex items-center gap-2">
          <Monitor class="w-5 h-5" />
          座位概览
        </h3>
        <span class="text-sm text-text-secondary">
          空闲 <span class="text-accent font-bold">{{ availabilitySummary.available }}</span> /
          总计 <span class="text-text-primary font-bold">{{ store.seats.length }}</span>
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20">
          <div class="w-3 h-3 rounded-full bg-accent" />
          <div>
            <p class="text-xs text-text-secondary">空闲</p>
            <p class="text-sm font-bold text-accent">{{ availabilitySummary.available }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 p-2 rounded bg-alert/10 border border-alert/20">
          <div class="w-3 h-3 rounded-full bg-alert" />
          <div>
            <p class="text-xs text-text-secondary">占用</p>
            <p class="text-sm font-bold text-alert">{{ availabilitySummary.occupied }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20">
          <div class="w-3 h-3 rounded-full bg-warning" />
          <div>
            <p class="text-xs text-text-secondary">预留</p>
            <p class="text-sm font-bold text-warning">{{ availabilitySummary.reserved }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 p-2 rounded bg-text-secondary/10 border border-text-secondary/20">
          <div class="w-3 h-3 rounded-full bg-text-secondary" />
          <div>
            <p class="text-xs text-text-secondary">维修</p>
            <p class="text-sm font-bold text-text-secondary">{{ availabilitySummary.maintenance }}</p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border-card">
        <div v-for="(count, zone) in availabilitySummary.byZone" :key="zone" class="flex items-center gap-1.5 text-xs">
          <div class="w-2.5 h-2.5 rounded" :style="{ backgroundColor: zoneColor(zone) }" />
          <span class="text-text-secondary">{{ zone }}区:</span>
          <span class="font-bold" :style="{ color: zoneColor(zone) }">{{ count }}</span>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">座位图</h3>
      <div v-if="groupedSeats" class="space-y-6">
        <div v-for="(zoneSeats, zone) in groupedSeats" :key="zone">
          <h4 class="font-heading text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <div class="w-3 h-3 rounded" :style="{ backgroundColor: zoneColor(zone) }" />
            {{ zone }}区
            <span class="text-xs text-text-secondary">({{ zoneSeats.length }}座)</span>
          </h4>
          <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(72px, 1fr))">
            <div
              v-for="seat in zoneSeats"
              :key="seat.id"
              class="relative rounded-lg flex flex-col items-center justify-center py-3 px-1 cursor-pointer transition-all duration-200 border"
              :class="seatCardClasses(seat)"
              @click="toggleSeatSelect(seat)"
            >
              <span class="font-heading font-bold text-sm">{{ seat.seat_number }}</span>
              <span v-if="seat.status === 'maintenance'" class="text-[10px] mt-0.5 text-text-secondary">维修</span>
              <div v-else-if="seat.status === 'occupied' || seat.status === 'reserved'" class="mt-0.5">
                <router-link
                  v-if="seat.current_registration_id"
                  :to="`/registrations/${seat.current_registration_id}`"
                  class="text-[10px] text-accent hover:underline"
                  @click.stop
                >
                  查看报名
                </router-link>
              </div>
              <div
                v-if="isSeatSelected(seat)"
                class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50"
              >
                <Check class="w-3 h-3 text-bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedSeatIds.length > 0"
      class="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur border-t border-accent/30 shadow-[0_-4px_24px_rgba(0,255,136,0.15)]"
    >
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <Check class="w-4 h-4 text-accent" />
          </div>
          <span class="text-sm font-bold text-accent">已选 {{ selectedSeatIds.length }} 台</span>
        </div>
        <button class="btn-primary text-sm" @click="showAllocPanel = true">
          分配座位
        </button>
        <button class="btn-danger text-sm ml-2" @click="clearSelection">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="showAllocPanel" class="card p-6 border-accent/30 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-heading text-lg font-semibold text-accent flex items-center gap-2">
          <AlertTriangle v-if="allocWarning" class="w-5 h-5 text-warning" />
          创建分配
        </h3>
        <button class="text-text-secondary hover:text-text-primary transition-colors" @click="showAllocPanel = false">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs text-text-secondary mb-1 block">关联报名</label>
          <select v-model="allocRegistrationId" class="select-dark w-full">
            <option value="">请选择已确认的报名</option>
            <option
              v-for="reg in confirmedRegistrations"
              :key="reg.id"
              :value="reg.id"
            >
              #{{ reg.id.slice(0, 8) }} · {{ reg.team_name }} · {{ reg.player_count }}人
            </option>
          </select>
        </div>

        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-text-secondary">已选座位:</span>
            <span class="font-bold text-accent">{{ selectedSeatIds.length }}</span>
          </div>
          <template v-if="allocRegistrationId">
            <div class="flex items-center gap-2">
              <span class="text-text-secondary">需要座位:</span>
              <span class="font-bold" :class="allocWarning ? 'text-warning' : 'text-accent'">
                {{ selectedRegPlayerCount }}
              </span>
            </div>
            <div
              v-if="allocWarning"
              class="flex items-center gap-1 text-warning text-xs"
            >
              <AlertTriangle class="w-3.5 h-3.5" />
              {{ selectedSeatIds.length < selectedRegPlayerCount ? '座位不足' : '座位超出' }}
            </div>
          </template>
        </div>

        <div>
          <label class="text-xs text-text-secondary mb-1 block">冲突原因（可选）</label>
          <textarea
            v-model="conflictReason"
            class="input-dark w-full h-20 resize-none"
            placeholder="如有冲突请说明原因..."
          />
        </div>

        <div class="flex items-center gap-3">
          <button
            class="btn-primary"
            :disabled="!allocRegistrationId || allocating"
            @click="handleAllocate"
          >
            {{ allocating ? '分配中...' : '分配座位' }}
          </button>
          <button class="btn-danger" @click="showAllocPanel = false">取消</button>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="font-heading text-lg font-semibold text-accent mb-4">分配记录</h3>
      <div v-if="store.allocations.length === 0" class="text-text-secondary text-sm py-8 text-center">
        暂无分配记录
      </div>
      <div v-else class="space-y-3">
        <router-link
          v-for="alloc in store.allocations"
          :key="alloc.id"
          :to="`/seats/allocations/${alloc.id}`"
          class="flex items-center gap-4 p-3 rounded bg-bg-primary/50 hover:bg-accent/5 transition-colors group"
        >
          <div
            class="w-2 h-2 rounded-full shrink-0"
            :class="alloc.status === 'confirmed' ? 'bg-accent' : alloc.status === 'released' ? 'bg-text-secondary' : 'bg-warning'"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm text-text-primary group-hover:text-accent transition-colors">
              报名 #{{ alloc.registration_id.slice(0, 8) }}
            </p>
            <p class="text-xs text-text-secondary">座位: {{ alloc.seat_ids }} · {{ alloc.allocated_by }}</p>
            <p v-if="alloc.conflict_reason" class="text-xs text-warning mt-0.5 flex items-center gap-1">
              <AlertTriangle class="w-3 h-3" />
              {{ alloc.conflict_reason }}
            </p>
          </div>
          <span class="text-xs" :class="alloc.status === 'confirmed' ? 'text-accent' : alloc.status === 'released' ? 'text-text-secondary' : 'text-warning'">
            {{ allocStatusLabel(alloc.status) }}
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import type { Seat } from '@/types'
import { ROLE_COLORS } from '@/types'
import { Monitor, AlertTriangle, Check, X, ArrowLeft } from 'lucide-vue-next'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const selectedSeatIds = ref<string[]>([])
const showAllocPanel = ref(false)
const allocRegistrationId = ref('')
const conflictReason = ref('')
const allocating = ref(false)
const returnToRegistration = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([
    store.fetchSeats(),
    store.fetchAllocations(),
    store.fetchRegistrations(),
  ])
  if (route.query.registration_id) {
    const regId = route.query.registration_id as string
    allocRegistrationId.value = regId
    returnToRegistration.value = regId
    showAllocPanel.value = true
  }
})

const groupedSeats = computed(() => {
  const groups: Record<string, Seat[]> = {}
  for (const seat of store.seats) {
    if (!groups[seat.zone]) groups[seat.zone] = []
    groups[seat.zone].push(seat)
  }
  const order = ['A', 'B', 'C', 'VIP']
  const sorted: Record<string, Seat[]> = {}
  for (const z of order) {
    if (groups[z]) sorted[z] = groups[z]
  }
  return sorted
})

const availabilitySummary = computed(() => {
  const counts = { available: 0, occupied: 0, reserved: 0, maintenance: 0 }
  const byZone: Record<string, number> = {}
  for (const seat of store.seats) {
    counts[seat.status]++
    if (seat.status === 'available') {
      byZone[seat.zone] = (byZone[seat.zone] || 0) + 1
    }
  }
  return { ...counts, byZone }
})

const confirmedRegistrations = computed(() => {
  return store.registrations.filter(r => r.status === 'confirmed')
})

const selectedRegPlayerCount = computed(() => {
  if (!allocRegistrationId.value) return 0
  const reg = store.registrations.find(r => r.id === allocRegistrationId.value)
  return reg?.player_count ?? 0
})

const allocWarning = computed(() => {
  if (!allocRegistrationId.value) return false
  return selectedSeatIds.value.length !== selectedRegPlayerCount.value
})

const targetRegistration = computed(() => {
  if (!returnToRegistration.value) return null
  return store.registrations.find(r => r.id === returnToRegistration.value)
})

function zoneColor(zone: string) {
  switch (zone) {
    case 'A': return '#00FF88'
    case 'B': return '#5AC8FA'
    case 'C': return '#FFCC00'
    case 'VIP': return '#FF9500'
    default: return '#8B949E'
  }
}

function isSeatSelected(seat: Seat) {
  return selectedSeatIds.value.includes(seat.id)
}

function seatCardClasses(seat: Seat) {
  const selected = isSeatSelected(seat)
  const base = 'min-h-[60px]'
  switch (seat.status) {
    case 'available':
      return `${base} bg-accent/10 border-accent/30 text-accent ${selected ? 'ring-2 ring-accent shadow-[0_0_12px_rgba(0,255,136,0.5)]' : 'hover:shadow-[0_0_8px_rgba(0,255,136,0.3)]'}`
    case 'occupied':
      return `${base} bg-alert/10 border-alert/30 text-alert ${selected ? 'ring-2 ring-alert shadow-[0_0_12px_rgba(255,59,48,0.5)]' : ''} cursor-default`
    case 'reserved':
      return `${base} bg-warning/10 border-warning/30 text-warning ${selected ? 'ring-2 ring-warning shadow-[0_0_12px_rgba(255,204,0,0.5)]' : ''} cursor-default`
    case 'maintenance':
      return `${base} bg-text-secondary/10 border-text-secondary/30 text-text-secondary cursor-not-allowed opacity-60`
    default:
      return `${base} bg-bg-primary border-border-card text-text-secondary`
  }
}

function toggleSeatSelect(seat: Seat) {
  if (seat.status !== 'available') return
  const idx = selectedSeatIds.value.indexOf(seat.id)
  if (idx >= 0) {
    selectedSeatIds.value.splice(idx, 1)
  } else {
    selectedSeatIds.value.push(seat.id)
  }
}

function clearSelection() {
  selectedSeatIds.value = []
  showAllocPanel.value = false
  allocRegistrationId.value = ''
  conflictReason.value = ''
}

async function handleAllocate() {
  if (!allocRegistrationId.value || selectedSeatIds.value.length === 0) return
  allocating.value = true
  try {
    const result = await store.createAllocation(
      allocRegistrationId.value,
      selectedSeatIds.value,
      conflictReason.value || undefined,
    )
    if (result.success) {
      if (returnToRegistration.value) {
        router.push(`/registrations/${returnToRegistration.value}`)
        return
      }
      selectedSeatIds.value = []
      showAllocPanel.value = false
      allocRegistrationId.value = ''
      conflictReason.value = ''
    }
  } finally {
    allocating.value = false
  }
}

function allocStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待确认'
    case 'confirmed': return '已确认'
    case 'released': return '已释放'
    default: return status
  }
}
</script>
