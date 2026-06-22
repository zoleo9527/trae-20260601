<script setup lang="ts">
import { UserPlus, ArrowRight, CheckCircle, Search, XCircle, Clock } from 'lucide-vue-next'
import type { IssueProgress } from '../../../api/types'

interface Props {
  progresses?: IssueProgress[]
}

const props = withDefaults(defineProps<Props>(), {
  progresses: () => []
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const actionConfig: Record<string, { icon: any; label: string; color: string }> = {
  assign: {
    icon: UserPlus,
    label: '分配问题',
    color: 'bg-blue-500'
  },
  progress: {
    icon: ArrowRight,
    label: '进度更新',
    color: 'bg-amber-500'
  },
  complete: {
    icon: CheckCircle,
    label: '整改完成',
    color: 'bg-green-500'
  },
  verify: {
    icon: Search,
    label: '验证通过',
    color: 'bg-emerald-500'
  },
  reject: {
    icon: XCircle,
    label: '验证驳回',
    color: 'bg-red-500'
  }
}

const getActionConfig = (actionType: string) => {
  return actionConfig[actionType] || {
    icon: Clock,
    label: actionType,
    color: 'bg-gray-500'
  }
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="(progress, index) in progresses"
      :key="progress.id"
      class="relative pl-8 pb-6 last:pb-0"
    >
      <div
        v-if="index < progresses.length - 1"
        class="absolute left-3 top-6 w-px h-full bg-gray-200"
      />
      <div
        :class="[
          'absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white',
          getActionConfig(progress.action_type).color
        ]"
      >
        <component :is="getActionConfig(progress.action_type).icon" class="w-3 h-3 text-white" />
      </div>
      <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-900">
                {{ getActionConfig(progress.action_type).label }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600">
              {{ progress.description }}
            </p>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <div class="flex items-center gap-1">
            <span class="font-medium">{{ progress.operator }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            <span>{{ formatDate(progress.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="progresses.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <Clock class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>暂无整改进度记录</p>
    </div>
  </div>
</template>
