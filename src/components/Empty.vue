<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  icon?: any
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: Inbox,
  title: '暂无数据',
  description: ''
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
      <component :is="props.icon" class="w-10 h-10 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-slate-500 text-center max-w-sm">{{ description }}</p>
  </div>
</template>
