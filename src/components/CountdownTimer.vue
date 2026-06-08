<template>
  <span class="font-heading text-sm font-semibold tabular-nums" :class="colorClass">
    {{ display }}
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  deadline: string
}>()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const diff = computed(() => {
  const deadline = new Date(props.deadline)
  return deadline.getTime() - now.value.getTime()
})

const isOverdue = computed(() => diff.value < 0)
const isUrgent = computed(() => diff.value > 0 && diff.value < 10 * 60 * 1000)

const display = computed(() => {
  const absDiff = Math.abs(diff.value)
  const totalSeconds = Math.floor(absDiff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')

  if (isOverdue.value) {
    return `-${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
})

const colorClass = computed(() => {
  if (isOverdue.value) return 'text-alert text-glow-red'
  if (isUrgent.value) return 'text-warning'
  return 'text-accent'
})
</script>
