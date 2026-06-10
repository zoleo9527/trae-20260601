<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus, ShelterStatus, HarvestPlanStatus, RoleType, StuckType } from '@/types'
import {
  orderStatusText, orderStatusBg,
  shelterStatusText, shelterStatusColor,
  harvestStatusText, roleText, roleColor,
  stuckTypeText, stuckTypeColor,
} from '@/utils'

type TagType = 'order' | 'shelter' | 'harvest' | 'role' | 'stuck'

const props = defineProps<{
  type: TagType
  value: string
  size?: 'sm' | 'md' | 'lg'
}>()

const cls = computed(() => {
  const sizeCls = props.size === 'lg' ? 'text-sm px-3 py-1' : props.size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'
  return sizeCls
})

const tagStyle = computed(() => {
  if (props.type === 'order') {
    return { cls: orderStatusBg[props.value as OrderStatus], text: orderStatusText[props.value as OrderStatus] }
  }
  if (props.type === 'shelter') {
    return { cls: shelterStatusColor[props.value as ShelterStatus], text: shelterStatusText[props.value as ShelterStatus] }
  }
  if (props.type === 'harvest') {
    const map: Record<HarvestPlanStatus, { cls: string; text: string }> = {
      PENDING: { cls: 'bg-gold-50 text-gold-600', text: harvestStatusText.PENDING },
      HARVESTING: { cls: 'bg-base-100 text-base-700', text: harvestStatusText.HARVESTING },
      DONE: { cls: 'bg-success-50 text-success-600', text: harvestStatusText.DONE },
      ABNORMAL: { cls: 'bg-alert-50 text-alert-600', text: harvestStatusText.ABNORMAL },
    }
    return map[props.value as HarvestPlanStatus]
  }
  if (props.type === 'role') {
    return { cls: roleColor[props.value as RoleType | 'SYSTEM'], text: roleText[props.value as RoleType | 'SYSTEM'] }
  }
  if (props.type === 'stuck') {
    const color = stuckTypeColor[props.value as StuckType]
    return {
      cls: 'border',
      text: stuckTypeText[props.value as StuckType],
      style: { borderColor: color + '60', backgroundColor: color + '15', color },
    }
  }
  return { cls: '', text: props.value }
})

const isPulse = computed(() => props.value === 'STUCK' || props.value === 'ABNORMAL')
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md font-medium border whitespace-nowrap',
      cls,
      tagStyle.cls,
      isPulse ? 'animate-pulse-soft' : '',
    ]"
    :style="(tagStyle as any).style || {}">
    <span v-if="isPulse"
      class="w-1.5 h-1.5 rounded-full mr-1.5"
      :style="{ background: (tagStyle as any).style?.color || '#D64545' }" />
    {{ tagStyle.text }}
  </span>
</template>
