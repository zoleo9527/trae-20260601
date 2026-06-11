<script setup lang="ts">
defineProps<{
  hoverable?: boolean
}>()
</script>

<template>
  <div
    class="bg-[#F4F4F5] border border-gray-200 rounded-[4px] overflow-hidden transition-all duration-300"
    :class="hoverable !== false ? 'hover:-translate-y-1 hover:shadow-xl hover:border-gray-300' : ''"
  >
    <div v-if="$slots.header" class="px-5 py-4 border-b border-gray-200 bg-white/60">
      <slot name="header" />
    </div>
    <div class="px-5 py-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-5 py-4 border-t border-gray-200 bg-white/60">
      <slot name="footer" />
    </div>
  </div>
</template>
