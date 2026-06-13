<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="flex gap-4"
    >
      <div class="flex-shrink-0 flex flex-col items-center">
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
            getAvatarClass(item.operatorRole)
          ]"
        >
          {{ getAvatarText(item.operator) }}
        </div>
        <div
          v-if="index < items.length - 1"
          class="w-0.5 h-full bg-gray-200 mt-2"
        />
      </div>
      
      <div class="flex-1 pb-6">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ item.operator }}</span>
              <span :class="getRoleClass(item.operatorRole)">
                {{ getRoleText(item.operatorRole) }}
              </span>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ formatTime(item.timestamp) }}
            </div>
          </div>
          <span
            v-if="item.action"
            class="text-sm font-medium text-gray-600"
          >
            {{ item.action }}
          </span>
        </div>
        
        <div class="mt-2 text-sm text-gray-700">
          {{ item.remark }}
        </div>
        
        <div
          v-if="item.fromStatus && item.toStatus"
          class="mt-2 flex items-center gap-2"
        >
          <StatusBadge :status="(item.fromStatus as AssignmentStatus)" type="assignment" />
          <ArrowRight class="w-4 h-4 text-gray-400" />
          <StatusBadge :status="(item.toStatus as AssignmentStatus)" type="assignment" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { HistoryRecord, UserRole } from '@/types'
import StatusBadge from './StatusBadge.vue'
import type { AssignmentStatus } from '@/types'

defineProps<{
  items: HistoryRecord[]
}>()

const getAvatarClass = (role: UserRole) => {
  const classes: Record<UserRole, string> = {
    project_manager: 'bg-primary-500 text-white',
    translator: 'bg-warning-500 text-white',
    reviewer: 'bg-success-500 text-white',
  }
  return classes[role]
}

const getAvatarText = (name: string) => {
  return name.charAt(0)
}

const getRoleClass = (role: UserRole) => {
  const classes: Record<UserRole, string> = {
    project_manager: 'px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700',
    translator: 'px-2 py-0.5 rounded text-xs bg-warning-100 text-warning-700',
    reviewer: 'px-2 py-0.5 rounded text-xs bg-success-100 text-success-700',
  }
  return classes[role]
}

const getRoleText = (role: UserRole) => {
  const texts: Record<UserRole, string> = {
    project_manager: '项目经理',
    translator: '译员',
    reviewer: '审校',
  }
  return texts[role]
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>