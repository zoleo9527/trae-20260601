<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="getStatusColor(status)"
  >
    {{ getStatusText(status) }}
  </span>
</template>

<script setup lang="ts">
import { useFormat } from '../composables/useFormat'
import type { OrderStatus, CustomsStatus } from '../types'

interface Props {
  status: OrderStatus | CustomsStatus
  type?: 'order' | 'customs'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'order'
})

const { getStatusText, getStatusColor } = useFormat()
</script>
