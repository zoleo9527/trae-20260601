<template>
  <div class="flex items-center gap-0">
    <div
      v-for="(step, index) in steps"
      :key="index"
      class="flex items-center"
    >
      <div class="flex flex-col items-center">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold transition-all duration-300"
          :class="stepClass(index)"
        >
          <template v-if="index < currentStep">✓</template>
          <template v-else>{{ index + 1 }}</template>
        </div>
        <span
          class="mt-1 text-xs whitespace-nowrap"
          :class="index <= currentStep ? 'text-accent' : 'text-text-secondary'"
        >
          {{ step.label }}
        </span>
        <span
          v-if="step.owner"
          class="mt-0.5 text-[10px] whitespace-nowrap"
          :style="{ color: ownerColor(step.owner) }"
        >
          {{ step.owner }}
        </span>
      </div>
      <div
        v-if="index < steps.length - 1"
        class="w-12 h-0.5 mx-1 mb-5 transition-all duration-300"
        :class="index < currentStep ? 'bg-accent glow-green' : 'bg-border-card'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ROLE_COLORS } from '@/types'
import type { Role } from '@/types'

const steps = [
  { label: '提交报名', owner: '网管' as Role },
  { label: '确认报名', owner: '赛事运营' as Role },
  { label: '座位分配', owner: '网管' as Role },
  { label: '终审通过', owner: '店长' as Role },
]

const props = defineProps<{
  status: string
}>()

const statusStepMap: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  seating: 2,
  completed: 3,
  rejected: -1,
  escalated: 1,
}

const currentStep = computed(() => statusStepMap[props.status] ?? 0)

function stepClass(index: number) {
  if (props.status === 'rejected') {
    if (index <= currentStep.value) return 'bg-text-secondary text-bg-primary opacity-50'
    return 'bg-bg-primary text-text-secondary border border-border-card opacity-50'
  }
  if (index < currentStep.value) {
    return 'bg-accent text-bg-primary'
  }
  if (index === currentStep.value) {
    return 'bg-accent/20 text-accent border-2 border-accent glow-green'
  }
  return 'bg-bg-primary text-text-secondary border border-border-card'
}

function ownerColor(role: string) {
  return ROLE_COLORS[role as Role] ?? '#8B949E'
}
</script>
