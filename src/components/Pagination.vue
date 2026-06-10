<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  current: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:current', val: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)

const pages = computed(() => {
  const result: number[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    result.push(i)
  }
  return result
})
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 pt-4">
    <button
      :disabled="current <= 1"
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="emit('update:current', current - 1)"
    >
      <ChevronLeft :size="16" />
    </button>
    <button
      v-for="page in pages"
      :key="page"
      :class="[
        'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
        page === current
          ? 'bg-emerald-600 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      ]"
      @click="emit('update:current', page)"
    >
      {{ page }}
    </button>
    <button
      :disabled="current >= totalPages"
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      @click="emit('update:current', current + 1)"
    >
      <ChevronRight :size="16" />
    </button>
  </div>
</template>
