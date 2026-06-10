<script setup lang="ts">
import type { OperationLog } from '../types'
import { ACTION_LABEL, ROLE_LABEL } from '../types/enums'

defineProps<{
  logs: OperationLog[]
}>()

function getTime(log: OperationLog): string {
  return log.timestamp || log.operateTime || ''
}

function getDetail(log: OperationLog): string {
  if (log.detail) return log.detail
  if (log.details && typeof log.details === 'object') {
    return Object.entries(log.details)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
  }
  return ''
}
</script>

<template>
  <div class="relative pl-6">
    <div
      v-for="(log, index) in logs"
      :key="log.id"
      class="relative pb-4 last:pb-0"
    >
      <div
        class="absolute -left-6 top-1.5 w-3 h-3 bg-blue-900 border-2 border-white rounded-full z-10"
      ></div>
      <div
        v-if="index !== logs.length - 1"
        class="absolute -left-[22px] top-4 bottom-0 w-px bg-gray-300"
      ></div>

      <div class="ml-2">
        <div class="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>{{ getTime(log) }}</span>
          <span class="text-gray-300">|</span>
          <span class="font-medium text-gray-700">{{ log.operatorName }}</span>
          <span class="text-gray-400">({{ ROLE_LABEL[log.operatorRole] }})</span>
        </div>
        <div class="text-sm font-medium text-gray-900 mb-1">
          {{ ACTION_LABEL[log.action] }}
        </div>
        <div v-if="getDetail(log)" class="text-sm text-gray-600">
          {{ getDetail(log) }}
        </div>
      </div>
    </div>
  </div>
</template>
