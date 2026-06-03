<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        />
        <div
          class="relative z-10 w-full max-w-lg rounded-xl border border-factory-border bg-factory-surface shadow-2xl"
        >
          <div class="flex items-center justify-between border-b border-factory-border px-6 py-4">
            <h2 class="text-base font-semibold text-white">{{ title }}</h2>
            <button
              class="rounded-md p-1 text-gray-500 transition-colors hover:bg-factory-surface-light hover:text-gray-300"
              @click="close"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="px-6 py-4">
            <slot />
          </div>

          <div class="flex justify-end border-t border-factory-border px-6 py-3">
            <button
              class="rounded-lg bg-factory-surface-light px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-factory-border"
              @click="close"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.25s ease-out;
}
.modal-leave-active {
  transition: all 0.2s ease-in;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to {
  opacity: 0;
}
</style>
