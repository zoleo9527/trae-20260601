<template>
  <header class="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 gap-4">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-neutral-800">{{ pageTitle }}</h1>
      <span v-if="subTitle" class="text-sm text-neutral-500 hidden sm:inline">· {{ subTitle }}</span>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative hidden md:block">
        <AppIcon name="IconSearch" class="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="搜索电梯编号 / 年检单号 / 整改单号"
          class="w-72 pl-9 pr-4 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
        />
      </div>

      <button
        type="button"
        class="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
        :class="{ 'text-primary-600': appStore.showAlertPanel }"
        @click="appStore.toggleAlertPanel()"
      >
        <AppIcon name="IconBell" class="w-5 h-5" />
        <span
          v-if="appStore.unreadCount > 0"
          class="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white"
        >
          {{ appStore.unreadCount > 9 ? '9+' : appStore.unreadCount }}
        </span>
      </button>

      <div class="flex items-center gap-3 pl-3 border-l border-neutral-200">
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {{ appStore.currentUser.avatar }}
        </div>
        <div class="hidden sm:block">
          <div class="text-sm font-semibold text-neutral-800">{{ appStore.currentUser.name }}</div>
          <div class="text-xs text-neutral-500">{{ appStore.currentUser.department }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const route = useRoute()

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    '/': '工作台',
    '/inspection': '年检资料管理',
    '/inspection/new': '提交年检',
    '/inspection/analytics': '不合格统计分析',
    '/rectification': '整改闭环管理',
    '/rectification/completed': '已完成整改',
    '/rectification/closed': '闭环归档回看',
    '/alerts': '异常提醒中心',
    '/overview': '项目总览'
  }
  const path = route.path as keyof typeof map
  return map[path] || route.meta?.title as string || '页面'
})

const subTitle = computed(() => {
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
})
</script>
