<script setup lang="ts">
import type { StatusLog } from '../types/index.js';
import { InspectionStatusLabel } from '../types/index.js';
import { CheckCircle, Clock, AlertCircle, Send, Wrench, Eye, XCircle } from 'lucide-vue-next';

interface Props {
  logs: StatusLog[];
}

defineProps<Props>();

const statusIcons: Record<string, any> = {
  pending_review: AlertCircle,
  dispatched: Send,
  in_progress: Wrench,
  completed: CheckCircle,
  pending_review_after: Eye,
  passed: CheckCircle,
  rejected: XCircle
};

const statusColors: Record<string, string> = {
  pending_review: 'bg-gray-400',
  dispatched: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-purple-500',
  pending_review_after: 'bg-orange-500',
  passed: 'bg-green-500',
  rejected: 'bg-red-500'
};
</script>

<template>
  <div class="relative">
    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
    <div class="space-y-6">
      <div
        v-for="(log, index) in logs"
        :key="log.id"
        class="relative pl-10 pb-6 last:pb-0"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div
          :class="[
            'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white',
            statusColors[log.toStatus] || 'bg-gray-400'
          ]"
        >
          <component
            :is="statusIcons[log.toStatus] || Clock"
            class="w-4 h-4 text-white"
          />
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-800">
              {{ InspectionStatusLabel[log.toStatus] }}
            </span>
            <span class="text-xs text-gray-500">{{ log.timestamp }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ log.remark }}</p>
          <p class="text-xs text-gray-400">操作人：{{ log.operatorName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
