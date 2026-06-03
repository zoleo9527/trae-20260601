<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const borderColors: Record<string, string> = {
  success: 'border-l-pass-green',
  warning: 'border-l-warn-orange',
  error: 'border-l-danger-red',
  info: 'border-l-flow-blue',
}
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-3 pointer-events-none">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border-l-4 bg-factory-surface px-4 py-3 shadow-lg"
        :class="borderColors[toast.type]"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white">{{ toast.title }}</p>
          <p class="mt-0.5 text-xs text-gray-400">{{ toast.message }}</p>
        </div>
        <button
          class="mt-0.5 shrink-0 text-gray-500 transition-colors hover:text-gray-300"
          @click="toastStore.removeToast(toast.id)"
        >
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
