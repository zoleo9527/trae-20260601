<template>
  <aside class="w-64 bg-white border-r border-neutral-200 flex flex-col">
    <div class="h-16 flex items-center gap-3 px-5 border-b border-neutral-200">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-sm">
        梯
      </div>
      <div>
        <div class="font-bold text-neutral-800 text-sm leading-tight">电梯维保系统</div>
        <div class="text-xs text-neutral-500">年检 · 整改闭环</div>
      </div>
    </div>

    <nav class="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
      <NuxtLink to="/" class="sidebar-link" :class="{ 'sidebar-link-active': isActive('/') }">
        <AppIcon name="IconDash" />
        <span>工作台</span>
      </NuxtLink>

      <div class="pt-4 pb-1 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        年检资料
      </div>
      <NuxtLink
        v-for="item in menuInspection"
        :key="item.to + item.label"
        :to="item.to"
        class="sidebar-link"
        :class="{ 'sidebar-link-active': isActive(item.to) }"
      >
        <AppIcon :name="item.icon" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-danger-100 text-danger-700 font-medium"
        >
          {{ item.badge }}
        </span>
      </NuxtLink>

      <div class="pt-4 pb-1 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        整改闭环
      </div>
      <NuxtLink
        v-for="item in menuRectification"
        :key="item.to + item.label"
        :to="item.to"
        class="sidebar-link"
        :class="{ 'sidebar-link-active': isActive(item.to) }"
      >
        <AppIcon :name="item.icon" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700 font-medium"
        >
          {{ item.badge }}
        </span>
      </NuxtLink>

      <div v-if="menuExtra.length > 0" class="pt-4 pb-1 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        管理
      </div>
      <NuxtLink
        v-for="item in menuExtra"
        :key="item.to + item.label"
        :to="item.to"
        class="sidebar-link"
        :class="{ 'sidebar-link-active': isActive(item.to) }"
      >
        <AppIcon :name="item.icon" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="border-t border-neutral-200 p-3">
      <RoleSwitcher />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { UserRole } from '~/types'

const route = useRoute()
const appStore = useAppStore()

const isActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path))

const stats = computed(() => appStore.statsByRole)

const menuByRole = computed<Record<UserRole, {
  inspection: any[]
  rectification: any[]
  extra: any[]
}>>(() => ({
  technician: {
    inspection: [
      { to: '/inspection/new', label: '现场填写年检', icon: 'IconPlus' },
      { to: '/inspection', label: '年检记录回看', icon: 'IconClipboard' }
    ],
    rectification: [
      { to: '/rectification', label: '待整改任务', icon: 'IconWrench', badge: stats.value.pendingRectification || undefined },
      { to: '/rectification/completed', label: '已完成待复查', icon: 'IconCheck' },
      { to: '/rectification/closed', label: '闭环记录', icon: 'IconFolder' }
    ],
    extra: []
  },
  customer_service: {
    inspection: [
      { to: '/inspection', label: '年检资料台账', icon: 'IconClipboard', badge: stats.value.underReview || undefined },
      { to: '/inspection/analytics', label: '不合格项统计', icon: 'IconChart' },
      { to: '/inspection/new', label: '协助录入年检', icon: 'IconPlus' }
    ],
    rectification: [
      { to: '/rectification', label: '整改进度跟进', icon: 'IconWrench', badge: stats.value.rectificationInProgress || undefined },
      { to: '/rectification/completed', label: '待复查清单', icon: 'IconEye' },
      { to: '/rectification/closed', label: '归档通知同步', icon: 'IconFolder' }
    ],
    extra: [
      { to: '/alerts', label: '通知管理', icon: 'IconBell' }
    ]
  },
  project_manager: {
    inspection: [
      { to: '/inspection', label: '年检记录审核', icon: 'IconClipboard', badge: stats.value.toReview || undefined },
      { to: '/inspection/new', label: '新建年检任务', icon: 'IconPlus' },
      { to: '/inspection/analytics', label: '不合格统计分析', icon: 'IconChart' }
    ],
    rectification: [
      { to: '/rectification', label: '整改派单管理', icon: 'IconWrench', badge: ((stats.value.toRecheck || 0) + (stats.value.toSignLoop || 0) + (stats.value.nonCompliant || 0)) || undefined },
      { to: '/rectification/completed', label: '待复查任务', icon: 'IconEye', badge: (stats.value.toRecheck || 0) + (stats.value.toSignLoop || 0) || undefined },
      { to: '/rectification/closed', label: '闭环归档回看', icon: 'IconFolder' }
    ],
    extra: [
      { to: '/alerts', label: '异常提醒中心', icon: 'IconBell' },
      { to: '/overview', label: '项目总览看板', icon: 'IconDashboard' }
    ]
  }
}))

const menuInspection = computed(() => menuByRole.value[appStore.currentRole].inspection)
const menuRectification = computed(() => menuByRole.value[appStore.currentRole].rectification)
const menuExtra = computed(() => menuByRole.value[appStore.currentRole].extra)
</script>
