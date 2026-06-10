<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">异常提醒中心</h2>
        <p class="text-sm text-neutral-500 mt-1">系统自动生成的期限预警、不合格通知、异常事件提醒</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="btn-secondary text-xs py-1.5"
          @click="markAllRead"
          :disabled="appStore.unreadCount === 0"
        >
          <AppIcon name="IconCheck" class="w-3.5 h-3.5 mr-1" />
          全部标记已读
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div
        v-for="s in statCards"
        :key="s.key"
        class="card p-4 cursor-pointer hover:shadow-card-hover transition-all"
        @click="activeType = s.key"
        :class="activeType === s.key ? 'ring-2 ring-primary-500 border-primary-300' : ''"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[11px] text-neutral-500">{{ s.label }}</div>
            <div class="text-xl font-bold mt-0.5" :class="s.colorClass">{{ s.value }}</div>
          </div>
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="s.bgClass">
            <AppIcon :name="s.icon" :class="['w-4.5 h-4.5', s.iconClass]" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 card overflow-hidden">
        <div class="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
          <div class="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg text-xs">
            <button
              v-for="t in typeTabs"
              :key="t.key"
              type="button"
              class="px-3 py-1.5 rounded-md font-medium transition-all"
              :class="activeType === t.key ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'"
              @click="activeType = t.key"
            >
              {{ t.label }}
              <span v-if="getCountByType(t.key) > 0" class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" :class="t.badgeClass">
                {{ getCountByType(t.key) }}
              </span>
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-colors"
              :class="onlyUnread ? 'bg-primary-100 text-primary-700 font-medium' : 'text-neutral-500 hover:bg-neutral-100'"
              @click="onlyUnread = !onlyUnread"
            >
              仅未读
            </button>
          </div>
        </div>

        <div class="divide-y divide-neutral-100">
          <div
            v-for="alert in filteredAlerts"
            :key="alert.id"
            class="p-4 hover:bg-neutral-50 transition-colors cursor-pointer relative"
            :class="!alert.isRead ? 'bg-primary-50' : ''"
            @click="handleAlertClick(alert)"
          >
            <div class="flex items-start gap-3.5">
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="alertStyle(alert.type).bgClass"
              >
                <AppIcon :name="alertStyle(alert.type).icon" :class="['w-4.5 h-4.5', alertStyle(alert.type).iconClass]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      :class="alertStyle(alert.type).badgeClass"
                    >
                      {{ alertTypeLabel(alert.type) }}
                    </span>
                    <span v-if="!alert.isRead" class="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
                  </div>
                  <div class="text-[11px] text-neutral-500 whitespace-nowrap flex-shrink-0">
                    {{ formatTime(alert.createdAt) }}
                  </div>
                </div>
                <h4 class="text-sm font-semibold text-neutral-800 mt-1.5">{{ alert.title }}</h4>
                <p class="text-xs text-neutral-600 mt-1 leading-relaxed">{{ alert.description }}</p>
                <div v-if="alert.meta" class="mt-2.5 flex items-center gap-3 text-[11px] flex-wrap">
                  <span v-if="alert.meta.elevator" class="flex items-center gap-1 text-neutral-500">
                    <AppIcon name="IconMapPin" class="w-3 h-3" />
                    {{ alert.meta.elevator }}
                  </span>
                  <span v-if="alert.meta.deadline" class="flex items-center gap-1" :class="deadlineColor(alert.meta.deadline)">
                    <AppIcon name="IconClock" class="w-3 h-3" />
                    截止：{{ alert.meta.deadline }}
                  </span>
                  <span v-if="alert.meta.relatedId" class="flex items-center gap-1 text-primary-600 hover:underline cursor-pointer" @click.stop>
                    <AppIcon name="IconLink" class="w-3 h-3" />
                    {{ alert.meta.relatedId }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredAlerts.length === 0" class="p-12 text-center">
            <AppIcon name="IconInbox" class="w-12 h-12 mx-auto text-neutral-300" />
            <p class="text-sm text-neutral-500 mt-3">暂无符合条件的提醒</p>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-4">提醒规则说明</h3>
          <div class="space-y-3.5 text-xs">
            <div v-for="(r, i) in rules" :key="i" class="flex items-start gap-2.5">
              <div
                class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                :class="r.bgClass"
              >
                <AppIcon :name="r.icon" :class="['w-3 h-3', r.iconClass]" />
              </div>
              <div class="flex-1">
                <div class="font-medium text-neutral-800">{{ r.title }}</div>
                <div class="text-[11px] text-neutral-500 mt-0.5">{{ r.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-3">本月异常趋势</h3>
          <div class="space-y-3">
            <div v-for="t in trend" :key="t.label" class="text-xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-neutral-600">{{ t.label }}</span>
                <span class="font-semibold" :class="t.colorClass">{{ t.value }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="t.barClass"
                  :style="{ width: t.percent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { Alert } from '~/types'

const appStore = useAppStore()
const activeType = ref<string>('all')
const onlyUnread = ref(false)

const typeTabs = [
  { key: 'all', label: '全部', badgeClass: 'bg-primary-100 text-primary-700' },
  { key: 'deadline', label: '期限预警', badgeClass: 'bg-danger-100 text-danger-700' },
  { key: 'recheck', label: '复检提醒', badgeClass: 'bg-warning-100 text-warning-700' },
  { key: 'non_compliant', label: '不合格通知', badgeClass: 'bg-danger-100 text-danger-700' },
  { key: 'system', label: '系统通知', badgeClass: 'bg-neutral-200 text-neutral-700' }
]

const statCards = computed(() => [
  { key: 'all', label: '全部提醒', value: appStore.alerts.length, icon: 'IconBell', colorClass: 'text-neutral-800', bgClass: 'bg-neutral-100', iconClass: 'text-neutral-600' },
  { key: 'unread', label: '未读消息', value: appStore.unreadCount, icon: 'IconAlertCircle', colorClass: 'text-primary-600', bgClass: 'bg-primary-100', iconClass: 'text-primary-600' },
  { key: 'deadline', label: '超期预警', value: getCountByType('deadline'), icon: 'IconAlertTriangle', colorClass: 'text-danger-600', bgClass: 'bg-danger-100', iconClass: 'text-danger-600' },
  { key: 'recheck', label: '待复检', value: getCountByType('recheck'), icon: 'IconRefreshCw', colorClass: 'text-warning-600', bgClass: 'bg-warning-100', iconClass: 'text-warning-600' },
  { key: 'nc', label: '不合格', value: getCountByType('non_compliant'), icon: 'IconXCircle', colorClass: 'text-danger-600', bgClass: 'bg-danger-100', iconClass: 'text-danger-600' }
])

function getCountByType(type: string) {
  if (type === 'all') return appStore.alerts.length
  return appStore.alerts.filter(a => a.type === type).length
}

const filteredAlerts = computed(() => {
  let list = [...appStore.alerts]
  if (activeType.value !== 'all') {
    list = list.filter(a => a.type === activeType.value)
  }
  if (onlyUnread.value) {
    list = list.filter(a => !a.isRead)
  }
  return list.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

function alertStyle(type: string) {
  const styles: Record<string, any> = {
    deadline: { icon: 'IconAlertTriangle', bgClass: 'bg-danger-100', iconClass: 'text-danger-600', badgeClass: 'bg-danger-100 text-danger-700' },
    recheck: { icon: 'IconRefreshCw', bgClass: 'bg-warning-100', iconClass: 'text-warning-600', badgeClass: 'bg-warning-100 text-warning-700' },
    non_compliant: { icon: 'IconXCircle', bgClass: 'bg-danger-100', iconClass: 'text-danger-600', badgeClass: 'bg-danger-100 text-danger-700' },
    system: { icon: 'IconInfo', bgClass: 'bg-primary-100', iconClass: 'text-primary-600', badgeClass: 'bg-primary-100 text-primary-700' }
  }
  return styles[type] || styles.system
}

function alertTypeLabel(type: string) {
  const labels: Record<string, string> = {
    deadline: '期限预警',
    recheck: '复检提醒',
    non_compliant: '不合格通知',
    system: '系统通知'
  }
  return labels[type] || '通知'
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function deadlineColor(d: string) {
  const now = new Date()
  const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000)
  if (diff < 0) return 'text-danger-600 font-medium'
  if (diff <= 2) return 'text-warning-600 font-medium'
  return 'text-neutral-500'
}

function handleAlertClick(alert: Alert) {
  if (!alert.isRead) {
    appStore.markAlertRead(alert.id)
  }
  if (alert.linkType === 'inspection' && alert.linkId) {
    appStore.setSelectedInspection(alert.linkId)
    navigateTo('/inspection')
  } else if (alert.linkType === 'rectification' && alert.linkId) {
    appStore.setSelectedRectification(alert.linkId)
    navigateTo('/rectification')
  }
}

function markAllRead() {
  appStore.markAllAlertsRead()
}

const rules = [
  { icon: 'IconAlertTriangle', iconClass: 'text-danger-600', bgClass: 'bg-danger-100', title: '整改超期预警', desc: '整改截止前2天自动提醒，超期当日升级为红色告警' },
  { icon: 'IconRefreshCw', iconClass: 'text-warning-600', bgClass: 'bg-warning-100', title: '待复检提醒', desc: '整改单提交自测后24小时内未安排复检，自动提醒主管' },
  { icon: 'IconXCircle', iconClass: 'text-danger-600', bgClass: 'bg-danger-100', title: '不合格通知', desc: '年检出具不合格结论后立即推送相关责任人' },
  { icon: 'IconFileCheck', iconClass: 'text-primary-600', bgClass: 'bg-primary-100', title: '闭环归档通知', desc: '整改复查通过后通知客服同步甲方并归档' }
]

const trend = [
  { label: '整改超期', value: '2起', percent: 40, colorClass: 'text-danger-600', barClass: 'bg-danger-500' },
  { label: '复检延迟', value: '1起', percent: 20, colorClass: 'text-warning-600', barClass: 'bg-warning-500' },
  { label: '不合格项', value: '7项', percent: 70, colorClass: 'text-danger-600', barClass: 'bg-danger-400' },
  { label: '按期闭环', value: '15份', percent: 85, colorClass: 'text-success-600', barClass: 'bg-success-500' }
]
</script>
