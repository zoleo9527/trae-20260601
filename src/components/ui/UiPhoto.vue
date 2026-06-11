<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  src: string[]
}

const props = defineProps<Props>()

const currentIndex = ref(0)
const showModal = ref(false)
const displayCount = computed(() => props.src.length > 9 ? `9+` : props.src.length)

const lastVisibleIndex = computed(() => {
  if (props.src.length <= 4) return props.src.length - 1
  return 3
})

function openViewer(index: number) {
  currentIndex.value = index
  showModal.value = true
}

function closeViewer() {
  showModal.value = false
}

function prev() {
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : props.src.length - 1
}

function next() {
  currentIndex.value = currentIndex.value < props.src.length - 1 ? currentIndex.value + 1 : 0
}

function handleKeydown(e: KeyboardEvent) {
  if (!showModal.value) return
  if (e.key === 'Escape') closeViewer()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

function stopPropagation(e: Event) {
  e.stopPropagation()
}

watch(showModal, (val) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    <div
      v-for="(url, index) in src.slice(0, 4)"
      :key="index"
      class="relative aspect-square rounded-[4px] overflow-hidden border border-gray-200 cursor-pointer group bg-gray-100"
      @click="openViewer(index)"
    >
      <img
        :src="url"
        :alt="`图片 ${index + 1}`"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        v-if="index === lastVisibleIndex && src.length > 4"
        class="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold backdrop-blur-sm"
      >
        +{{ src.length - 4 }}
      </div>
      <div
        v-if="index === 0 && src.length > 1"
        class="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-medium"
      >
        {{ displayCount }}
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
        @click="closeViewer"
      >
        <button
          type="button"
          class="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
          @click="closeViewer"
        >
          <X class="w-6 h-6" />
        </button>

        <button
          v-if="src.length > 1"
          type="button"
          class="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
          @click.stop="prev"
        >
          <ChevronLeft class="w-7 h-7" />
        </button>

        <div class="max-w-[90vw] max-h-[85vh]" @click="stopPropagation">
          <img
            :src="src[currentIndex]"
            :alt="`图片 ${currentIndex + 1}`"
            class="max-w-full max-h-[85vh] object-contain rounded-[4px] select-none"
          />
        </div>

        <button
          v-if="src.length > 1"
          type="button"
          class="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
          @click.stop="next"
        >
          <ChevronRight class="w-7 h-7" />
        </button>

        <div v-if="src.length > 1" class="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          {{ currentIndex + 1 }} / {{ src.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 0.2s ease;
}
.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}
</style>
