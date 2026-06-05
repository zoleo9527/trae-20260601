<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type: 'equipment' | 'course' | 'checkin' | 'rental'
}>()

const statusMap: Record<string, Record<string, { label: string; color: string }>> = {
  equipment: {
    available: { label: '空闲', color: 'bg-green-100 text-green-700' },
    rented: { label: '在租', color: 'bg-blue-100 text-blue-700' },
    maintenance: { label: '维护', color: 'bg-orange-100 text-orange-700' },
  },
  course: {
    pending: { label: '待确认', color: 'bg-amber-100 text-amber-700' },
    in_progress: { label: '可签到', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已结束', color: 'bg-slate-100 text-slate-700' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
  },
  checkin: {
    checked_in: { label: '已签到', color: 'bg-green-100 text-green-700' },
    no_show: { label: '爽约', color: 'bg-orange-100 text-orange-700' },
    pending: { label: '待签到', color: 'bg-blue-100 text-blue-700' },
  },
  rental: {
    active: { label: '在租', color: 'bg-blue-100 text-blue-700' },
    returned: { label: '已归还', color: 'bg-green-100 text-green-700' },
    abnormal: { label: '异常', color: 'bg-red-100 text-red-700' },
  },
}

const info = computed(() => {
  return statusMap[props.type]?.[props.status] ?? { label: props.status, color: 'bg-slate-100 text-slate-700' }
})
</script>

<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', info.color]">
    {{ info.label }}
  </span>
</template>
