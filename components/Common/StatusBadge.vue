<script setup lang="ts">
import type { CaseStatus } from '~/types'
import { statusLabels } from '~/types'

const props = defineProps<{
  status: CaseStatus
}>()

const badgeClass = computed(() => {
  const classMap: Record<CaseStatus, string> = {
    PENDING_SUBMIT: 'badge-pending',
    SUBMITTED: 'badge-info',
    REJECTED: 'badge-danger',
    COMPLETED: 'badge-success',
    REVIEW_FAILED: 'badge-danger'
  }
  return classMap[props.status]
})
</script>

<template>
  <span class="badge" :class="badgeClass">
    {{ statusLabels[status] }}
  </span>
</template>
