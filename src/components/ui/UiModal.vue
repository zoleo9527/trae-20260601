<script setup lang="ts">
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  open?: boolean
  closeOnEsc?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  closeOnEsc: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}

function handleKeydown(e: KeyboardEvent) {
  if (props.closeOnEsc && e.key === 'Escape' && props.open) {
    close()
  }
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}

watch(
  () => props.open,
  (val) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = val ? 'hidden' : ''
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="handleOverlayClick"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          class="relative bg-white rounded-[6px] shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col animate-in"
          @click="stopPropagation"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div class="text-base font-semibold text-gray-900">
              <slot name="title" />
            </div>
            <button
              type="button"
              class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[4px] transition-colors"
              @click="close"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="px-6 py-4 overflow-y-auto flex-1">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
}
.animate-in {
  animation: modalIn 0.25s ease-out;
}
@keyframes modalIn {
  from {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
