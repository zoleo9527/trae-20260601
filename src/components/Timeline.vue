<script setup lang="ts">
import { FileText, AlertCircle, Clock, User } from 'lucide-vue-next'
import type { OperationLog } from '../../../api/types'

interface Props {
  logs?: OperationLog[]
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => []
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

const getRoleLabel: Record<string, string> = {
  pm: '项目经理',
  captain: '测试队长',
  engineer: '开发工程师'
}

const getEntityIcon = (entityType: string) => {
  return entityType === 'test' ? FileText : AlertCircle
}

const getEntityColor = (entityType: string) => {
  return entityType === 'test'
    ? 'bg-blue-500'
    : 'bg-orange-500'
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="(log, index) in logs"
      :key="log.id"
      class="relative pl-8 pb-6 last:pb-0"
    >
      <div
        v-if="index < logs.length - 1"
        class="absolute left-3 top-6 w-px h-full bg-gray-200"
      />
      <div
        :class="[
          'absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white',
          getEntityColor(log.entity_type)
        ]"
      >
        <component :is="getEntityIcon(log.entity_type)" class="w-3 h-3 text-white" />
      </div>
      <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-900">{{ log.action }}</span>
              <span class="text-sm text-gray-500">
                {{ log.entity_type === 'test' ? '测试' : '问题' }}
              </span>
            </div>
            <p v-if="log.detail" class="mt-1 text-sm text-gray-600">
              {{ log.detail }}
            </p>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <div class="flex items-center gap-1">
            <User class="w-3.5 h-3.5" />
            <span>{{ getRoleLabel[log.operator_role] || log.operator_role }}</span>
            <span class="text-gray-400">·</span>
            <span>{{ log.operator_name }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            <span>{{ formatDate(log.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="logs.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <Clock class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>暂无操作记录</p>
    </div>
  </div>
</template>
  </div>
</template>
