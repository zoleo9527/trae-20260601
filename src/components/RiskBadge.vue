<script setup lang="ts">
import type { RiskLevel } from '../types/index.js';
import { RiskLevelLabel } from '../types/index.js';

interface Props {
  level: RiskLevel;
}

const props = defineProps<Props>();

const levelConfig: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
      levelConfig[props.level].bg,
      levelConfig[props.level].text,
      levelConfig[props.level].border
    ]"
  >
    <span
      :class="[
        'w-1.5 h-1.5 rounded-full mr-1.5',
        props.level === 'low' && 'bg-green-500',
        props.level === 'medium' && 'bg-yellow-500',
        props.level === 'high' && 'bg-orange-500',
        props.level === 'critical' && 'bg-red-500 animate-pulse'
      ]"
    />
    {{ RiskLevelLabel[props.level] }}
  </span>
</template>
