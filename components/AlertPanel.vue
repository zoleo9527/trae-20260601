<template>
  <div class="fixed inset-0 z-50 flex">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
      <div class="h-16 border-b border-neutral-200 flex items-center justify-between px-5">
        <div>
          <h2 class="text-base font-semibold text-neutral-800">异常提醒中心</h2>
          <p class="text-xs text-neutral-500 mt-0.5">共 {{ appStore.alerts.length }} 条，未读 {{ appStore.unreadCount }} 条</p>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
            @click="appStore.markAllAlertsRead()"
          >
            全部已读
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
            @click="$emit('close')"
          >
            <AppIcon name="IconX" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="border-b border-neutral-200 px-3 py-2 flex gap-1 overflow-x-auto scrollbar-thin">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
          :class="activeTab === tab.key ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-100 text-danger-700">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-thin divide-y divide-neutral-100">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
          :class="{ 'bg-blue-50': !alert.isRead }"
          @click="handleAlertClick(alert)"
        >
          <div class="flex gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="alertStyle(alert).iconBg"
            >
              <AppIcon :name="alertStyle(alert).icon" :class="['w-4 h-4', alertStyle(alert).iconColor]" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start gap-2">
                <h3 class="text-sm font-medium text-neutral-800 flex-1">{{ alert.title }}</h3>
                <span v-if="!alert.isRead" class="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0 mt-1.5"></span>
              </div>
              <p class="text-xs text-neutral-600 mt-1 line-clamp-2">{{ alert.message }}</p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-[11px] text-neutral-400 flex items-center gap-1">
                  <AppIcon name="IconClock" class="w-3 h-3" />
                  {{ formatTime(alert.createdAt) }}
                </span>
                <span
                  class="text-[11px] px-1.5 py-0.5 rounded-full"
                  :class="priorityStyle(alert.priority)"
                >
                  {{ priorityLabel(alert.priority) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredAlerts.length === 0" class="p-8 text-center">
          <AppIcon name="IconCheckCircle" class="w-10 h-10 mx-auto text-success-400" />
          <p class="text-sm text-neutral-500 mt-3">暂无相关提醒</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { Alert, AlertType, PriorityLevel } from '~/types'

defineEmits<{ (e: 'close'): void }>()
const router = useRouter()
const appStore = useAppStore()

const activeTab = ref<AlertType | 'all'>('all')

const tabs = computed(() => {
  const base = [
    { key: 'all' as const, label: '全部', count: appStore.unreadCount }
  ]
  const types: { key: AlertType; label: string }[] = [
    { key: 'deadline', label: '期限预警' },
    { key: 'recheck', label: '复查提醒' },
    { key: 'non_compliant', label: '不合格通知' },
    { key: 'rectification', label: '整改派单' },
    { key: 'system', label: '系统通知' }
  ]
  return [
    ...base,
    ...types.map(t => ({
      ...t,
      count: appStore.alerts.filter(a => a.type === t.key && !a.isRead).length
    }))
  ]
})

const filteredAlerts = computed(() => {
  const list = activeTab.value === 'all'
    ? appStore.alerts
    : appStore.alerts.filter(a => a.type === activeTab.value)
  return [...list].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

function alertStyle(alert: Alert) {
  const map: Record<AlertType, { icon: string; iconBg: string; iconColor: string }> = {
    deadline: { icon: 'IconClock', iconBg: 'bg-danger-100', iconColor: 'text-danger-600' },
    recheck: { icon: 'IconEye', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
    non_compliant: { icon: 'IconXCircle', iconBg: 'bg-danger-100', iconColor: 'text-danger-600' },
    rectification: { icon: 'IconWrench', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
    system: { icon: 'IconInfo', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' }
  }
  return map[alert.type]
}

function priorityStyle(p: PriorityLevel) {
  const map = {
    low: 'bg-neutral-100 text-neutral-600',
    medium: 'bg-primary-100 text-primary-700',
    high: 'bg-warning-100 text-warning-700',
    critical: 'bg-danger-100 text-danger-700'
  }
  return map[p]
}

function priorityLabel(p: PriorityLevel) {
  return { low: '低', medium: '中', high: '高', critical: '紧急' }[p]
}

function formatTime(t: string) {
  const d = new Date(t)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handleAlertClick(alert: Alert) {
  appStore.markAlertRead(alert.id)
  if (alert.relatedId) {
    if (alert.relatedType === 'inspection') {
      appStore.setSelectedInspection(alert.relatedId)
      router.push('/inspection')
    } else if (alert.relatedType === 'rectification') {
      appStore.setSelectedRectification(alert.relatedId)
      router.push('/rectification')
    }
  }
}
</script>
