<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDashboard } from 'lucide-vue-next'
import TodayTasks from '@/components/dashboard/TodayTasks.vue'
import StaffTracker from '@/components/dashboard/StaffTracker.vue'
import StuckAlerts from '@/components/dashboard/StuckAlerts.vue'
import ExceptionQuickTrigger from '@/components/dashboard/ExceptionQuickTrigger.vue'

const now = new Date()

const chineseDate = computed(() => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const w = weekDays[now.getDay()]
  return `${y}年${m}月${d}日 星期${w}`
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3 animate-slide-up">
      <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-flow-blue/10">
        <LayoutDashboard :size="22" class="text-flow-blue" />
      </div>
      <div>
        <h1 class="text-xl font-semibold text-white">今日工作台</h1>
        <p class="text-sm text-gray-400">{{ chineseDate }}</p>
      </div>
    </div>

    <div class="animate-slide-up [animation-delay:100ms]">
      <TodayTasks />
    </div>

    <div class="animate-slide-up [animation-delay:200ms]">
      <StaffTracker />
    </div>

    <div class="grid grid-cols-3 gap-6 animate-slide-up [animation-delay:300ms]">
      <div class="col-span-2">
        <StuckAlerts />
      </div>
      <div class="col-span-1">
        <ExceptionQuickTrigger />
      </div>
    </div>
  </div>
</template>
