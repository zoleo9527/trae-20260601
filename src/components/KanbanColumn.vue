<script setup lang="ts">
defineProps<{
  title: string
  count: number
  color: string
}>()
</script>

<template>
  <div class="flex flex-col min-h-0">
    <div class="flex items-center gap-2 mb-3">
      <span
        class="w-2 h-2 rounded-full"
        :style="{ backgroundColor: color }"
      />
      <span class="text-sm font-semibold text-gray-700">{{ title }}</span>
      <span
        class="ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
        :style="{ backgroundColor: color }"
      >
        {{ count }}
      </span>
    </div>
    <div class="flex-1 space-y-3 overflow-y-auto pr-1">
      <slot />
      <div
        v-if="count === 0"
        class="flex items-center justify-center py-12 text-sm text-gray-400"
      >
        暂无单据
      </div>
    </div>
  </div>
</template>
