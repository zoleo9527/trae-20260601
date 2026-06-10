<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  emit('close')
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="props.visible" class="fixed inset-0 z-50">
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleOverlayClick"
        ></div>

        <div class="absolute right-0 top-0 h-full w-1/2 bg-white shadow-xl flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{{ props.title }}</h3>
            <button
              type="button"
              class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-active > div:last-child,
.drawer-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
