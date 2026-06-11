<script setup lang="ts">
export interface TimelineItem {
  id: string | number
  title: string
  description?: string
  time?: string
  operator?: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
}

interface Props {
  items: TimelineItem[]
}

defineProps<Props>()

const colorMap: Record<string, string> = {
  blue: 'bg-[#1E40AF] ring-blue-100',
  green: 'bg-green-600 ring-green-100',
  orange: 'bg-orange-500 ring-orange-100',
  red: 'bg-red-600 ring-red-100',
  purple: 'bg-purple-600 ring-purple-100',
  gray: 'bg-gray-500 ring-gray-100'
}
</script>

<template>
  <div class="relative pl-8">
    <div class="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
    <div v-for="item in items" :key="item.id" class="relative pb-6 last:pb-0">
      <div
        class="absolute -left-[25px] top-1.5 w-6 h-6 rounded-full ring-4 flex items-center justify-center shrink-0 z-10 bg-white"
      >
        <div
          class="w-3 h-3 rounded-full"
          :class="colorMap[item.color || 'blue']"
        />
      </div>
      <div class="bg-white border border-gray-200 rounded-[4px] p-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <h4 class="text-sm font-semibold text-gray-900 leading-snug">{{ item.title }}</h4>
          <span v-if="item.time" class="text-xs text-gray-500 shrink-0 whitespace-nowrap mt-0.5">{{ item.time }}</span>
        </div>
        <p v-if="item.description" class="text-sm text-gray-600 leading-relaxed mb-2">{{ item.description }}</p>
        <div v-if="item.operator" class="text-xs text-gray-500 flex items-center gap-1">
          <span class="text-gray-400">操作人：</span>
          <span class="text-gray-700">{{ item.operator }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
