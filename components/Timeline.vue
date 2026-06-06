<template>
  <div class="space-y-4">
    <div
      v-for="(event, index) in events"
      :key="event.id"
      class="relative pl-8"
    >
      <div
        v-if="index < events.length - 1"
        class="absolute left-3 top-6 w-0.5 h-full bg-gray-200"
      ></div>
      <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-slate-500"></div>
      </div>
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="text-sm font-medium text-gray-900">{{ event.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ event.description }}</p>
          </div>
          <span class="text-xs text-gray-500 whitespace-nowrap ml-4">
            {{ formatDate(event.timestamp) }}
          </span>
        </div>
        <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>{{ event.operator }}</span>
          <span>·</span>
          <span>{{ getRoleText(event.operatorRole as any) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormat } from '../composables/useFormat'
import type { TimelineEvent } from '../types'

interface Props {
  events: TimelineEvent[]
}

defineProps<Props>()

const { formatDate, getRoleText } = useFormat()
</script>
