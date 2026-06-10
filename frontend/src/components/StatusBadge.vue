<script setup lang="ts">
import type { ReplacementStatus } from '../types'
import { STATUS_LABEL } from '../types/enums'
import { cn } from '../lib/utils'

const props = defineProps<{
  status: ReplacementStatus
}>()

const statusClasses: Record<ReplacementStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  pending_confirm: 'bg-orange-100 text-orange-700 border-orange-400',
  confirmed: 'bg-green-100 text-green-700 border-green-400',
  rejected: 'bg-red-100 text-red-700 border-red-400',
  resubmitted: 'bg-orange-100 text-orange-700 border-orange-400',
  completed: 'bg-green-100 text-green-700 border-green-400',
  closed: 'bg-gray-100 text-gray-700 border-gray-300',
}
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
      statusClasses[props.status]
    )"
  >
    {{ STATUS_LABEL[props.status] }}
  </span>
</template>
