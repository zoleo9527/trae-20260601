<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, ChevronRight, ChevronDown, Clock, ArrowRight } from 'lucide-vue-next'
import type { Order } from '@/types'
import { STATUS_LABELS, ROLE_LABELS } from '@/types'

defineProps<{ count: number; stuckOrders: Order[] }>()
defineEmits<{ select: [orderId: string] }>()

const expanded = ref(true)
</script>

<template>
  <div v-if="count > 0" class="px-6">
    <div class="rounded-xl overflow-hidden border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
      <button
        class="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:from-red-100 hover:to-orange-100 transition-colors"
        @click="expanded = !expanded"
      >
        <div class="relative flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
          <AlertTriangle class="w-4.5 h-4.5 text-white" />
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full text-[10px] font-bold text-red-600 flex items-center justify-center border border-red-200">
            {{ count }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span class="font-bold text-red-700">卡单预警</span>
          <span class="text-red-600/80">{{ count }}个单据阻塞中</span>
        </div>
        <component
          :is="expanded ? ChevronDown : ChevronRight"
          class="w-4 h-4 text-red-400 ml-auto"
        />
      </button>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="expanded" class="border-t border-red-200/60 bg-white">
          <div
            v-for="order in stuckOrders"
            :key="order.id"
            class="flex items-start gap-3 px-4 py-3 border-b border-red-100 last:border-b-0 hover:bg-red-50/60 cursor-pointer transition-colors"
            @click="$emit('select', order.id)"
          >
            <div class="shrink-0 mt-0.5">
              <AlertTriangle :size="16" class="text-red-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-[#1B4965]">{{ order.orderNo }}</span>
                <span class="text-sm text-gray-500">{{ order.customerName }}</span>
                <span class="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
                  {{ STATUS_LABELS[order.status] }}
                </span>
              </div>
              <div v-if="order.stuckReason" class="mt-1 flex items-start gap-1.5">
                <span class="shrink-0 mt-0.5">
                  <Clock :size="12" class="text-red-400" />
                </span>
                <span class="text-xs text-red-600 font-medium">{{ order.stuckReason }}</span>
              </div>
              <div v-if="order.stuckStep" class="mt-1 flex items-center gap-1.5">
                <ArrowRight :size="12" class="text-[#E8871E] shrink-0" />
                <span class="text-xs text-[#E8871E]">
                  阻塞步骤：<span class="font-semibold">{{ order.stuckStep }}</span>
                </span>
                <span class="text-xs text-gray-400">（{{ ROLE_LABELS[order.assignedRole] }}待处理）</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
