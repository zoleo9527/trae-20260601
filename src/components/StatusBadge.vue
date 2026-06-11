<script setup lang="ts">
import type { InspectionStatus } from '../types/index.js';
import { InspectionStatusLabel } from '../types/index.js';

interface Props {
  status: InspectionStatus;
}

const props = defineProps<Props>();

const statusConfig: Record<InspectionStatus, { bg: string; text: string; icon?: string }> = {
  pending_review: { bg: 'bg-gray-100', text: 'text-gray-700' },
  dispatched: { bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { bg: 'bg-purple-100', text: 'text-purple-700' },
  pending_review_after: { bg: 'bg-orange-100', text: 'text-orange-700' },
  passed: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' }
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
      statusConfig[props.status].bg,
      statusConfig[props.status].text
    ]"
  >
    {{ InspectionStatusLabel[props.status] }}
  </span>
</template>
