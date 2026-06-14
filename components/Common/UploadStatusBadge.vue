<script setup lang="ts">
import type { UploadStatus } from '~/types'
import { uploadStatusLabels } from '~/types'

const props = defineProps<{
  status: UploadStatus
}>()

const badgeClass = computed(() => {
  const classMap: Record<UploadStatus, string> = {
    NOT_UPLOADED: 'badge-pending',
    UPLOADED: 'badge-info',
    CONFIRMED: 'badge-success'
  }
  return classMap[props.status]
})
</script>

<template>
  <span class="badge" :class="badgeClass">
    {{ uploadStatusLabels[status] }}
  </span>
</template>
