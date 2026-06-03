<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="(card, index) in cards"
      :key="card.key"
      class="relative bg-factory-surface border border-factory-border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:border-factory-border-light animate-fade-in"
      :style="{ animationDelay: `${index * 100}ms` }"
      @click="card.route && router.push(card.route)"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-3xl font-mono font-bold" :class="card.textClass">
            {{ card.count }}
          </p>
          <p class="mt-1 text-sm text-gray-400">{{ card.label }}</p>
        </div>
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full"
          :class="card.iconBg"
        >
          <component :is="card.icon" class="w-5 h-5" :class="card.textClass" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, PenTool, RotateCcw, Truck } from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'

const router = useRouter()
const orderStore = useOrderStore()

const cards = computed(() => [
  {
    key: 'pending_qc',
    label: '待质检',
    count: orderStore.todayPendingQc.length,
    icon: ShieldCheck,
    textClass: 'text-warn-orange',
    iconBg: 'bg-warn-orange/15',
    route: '/qc',
  },
  {
    key: 'designing',
    label: '设计中',
    count: orderStore.todayDesigning.length,
    icon: PenTool,
    textClass: 'text-flow-blue',
    iconBg: 'bg-flow-blue/15',
    route: null,
  },
  {
    key: 'rejected',
    label: '已退回',
    count: orderStore.todayRejected.length,
    icon: RotateCcw,
    textClass: 'text-danger-red',
    iconBg: 'bg-danger-red/15',
    route: '/qc',
  },
  {
    key: 'pending_shipping',
    label: '待回寄',
    count: orderStore.todayPendingShipping.length,
    icon: Truck,
    textClass: 'text-warn-yellow',
    iconBg: 'bg-warn-yellow/15',
    route: '/shipping',
  },
])
</script>
