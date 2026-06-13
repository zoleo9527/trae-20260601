<template>
  <header class="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
    <div class="h-full px-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        <span
          v-if="subtitle"
          class="text-sm text-gray-500"
        >
          {{ subtitle }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>