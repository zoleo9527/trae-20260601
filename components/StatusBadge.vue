<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InspectionStatus, RectificationStatus, PriorityLevel } from '~/types'

interface Props {
  type?: 'inspection' | 'rectification' | 'priority' | 'todo'
  status: string
}

const props = defineProps<Props>()

const label = computed(() => {
  if (props.type === 'priority') {
    return { low: '低优先级', medium: '中优先级', high: '高优先级', critical: '紧急' }[props.status as PriorityLevel] || props.status
  }
  if (props.type === 'rectification') {
    return {
      pending: '待整改',
      in_progress: '整改中',
      recheck: '待复查',
      passed: '复查通过',
      failed: '复查未通过',
      closed: '已闭环'
    }[props.status as RectificationStatus] || props.status
  }
  return {
    pending: '待处理',
    under_review: '审核中',
    non_compliant: '不合格',
    compliant: '合格',
    rectifying: '整改中',
    closed: '已闭环'
  }[props.status as InspectionStatus] || props.status
})

const badgeClass = computed(() => {
  const status = props.status
  if (props.type === 'priority') {
    return {
      low: 'bg-neutral-100 text-neutral-700',
      medium: 'bg-primary-100 text-primary-700',
      high: 'bg-warning-100 text-warning-700',
      critical: 'bg-danger-100 text-danger-700'
    }[status as PriorityLevel] || 'bg-neutral-100 text-neutral-700'
  }
  if (props.type === 'rectification') {
    return {
      pending: 'bg-danger-100 text-danger-700',
      in_progress: 'bg-warning-100 text-warning-700',
      recheck: 'bg-primary-100 text-primary-700',
      passed: 'bg-success-100 text-success-700',
      failed: 'bg-danger-100 text-danger-700',
      closed: 'bg-neutral-100 text-neutral-700'
    }[status as RectificationStatus] || 'bg-neutral-100 text-neutral-700'
  }
  return {
    pending: 'bg-neutral-100 text-neutral-700',
    under_review: 'bg-primary-100 text-primary-700',
    non_compliant: 'bg-danger-100 text-danger-700',
    compliant: 'bg-success-100 text-success-700',
    rectifying: 'bg-warning-100 text-warning-700',
    closed: 'bg-neutral-100 text-neutral-700'
  }[status as InspectionStatus] || 'bg-neutral-100 text-neutral-700'
})

const dotClass = computed(() => {
  const status = props.status
  if (props.type === 'priority') {
    return {
      low: 'bg-neutral-500',
      medium: 'bg-primary-500',
      high: 'bg-warning-500',
      critical: 'bg-danger-500 animate-pulse'
    }[status as PriorityLevel] || 'bg-neutral-500'
  }
  if (props.type === 'rectification') {
    return {
      pending: 'bg-danger-500 animate-pulse',
      in_progress: 'bg-warning-500 animate-pulse',
      recheck: 'bg-primary-500 animate-pulse',
      passed: 'bg-success-500',
      failed: 'bg-danger-500',
      closed: 'bg-neutral-500'
    }[status as RectificationStatus] || 'bg-neutral-500'
  }
  return {
    pending: 'bg-neutral-500',
    under_review: 'bg-primary-500 animate-pulse',
    non_compliant: 'bg-danger-500 animate-pulse',
    compliant: 'bg-success-500',
    rectifying: 'bg-warning-500 animate-pulse',
    closed: 'bg-neutral-500'
  }[status as InspectionStatus] || 'bg-neutral-500'
})
</script>
