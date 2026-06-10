<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'
import { getDurationHours, stuckTypeText } from '@/utils'

const ordersStore = useOrdersStore()
const uiStore = useUiStore()
const router = useRouter()

const expanded = defineModel<boolean>('expanded', { default: false })

const stuckList = computed(() => ordersStore.stuckOrders)

function getTargetPath(order: any) {
  const t = order.stuckRecord?.stuckType
  if (t === 'CUSTOMER_CHANGE') return '/sales'
  if (t === 'FORECAST_DEVIATION') return '/grower'
  if (t === 'PACKAGE_DAMAGE') return '/packer'
  return '/sales'
}
</script>

<template>
  <div class="bg-alert-500 text-white relative overflow-hidden z-40">
    <div class="absolute inset-0 opacity-10"
      style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 10px, transparent 10px, transparent 20px);" />
    <div class="relative px-6 py-3 flex items-center gap-4">
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center animate-pulse-soft">
          <AlertTriangle :size="18" />
        </div>
        <div>
          <div class="text-[15px] font-bold leading-tight">
            <span class="data-num text-2xl mr-1">{{ stuckList.length }}</span>
            条业务卡住中
          </div>
          <div class="text-[11px] opacity-90 leading-tight">需要相关岗位及时处理</div>
        </div>
      </div>

      <button @click="expanded = !expanded"
        class="ml-auto md:ml-4 px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-sm flex items-center gap-1 transition-colors flex-shrink-0">
        <span>{{ expanded ? '收起详情' : '查看详情' }}</span>
        <ChevronUp v-if="expanded" :size="14" />
        <ChevronDown v-else :size="14" />
      </button>

      <button @click="router.push('/history')"
        class="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-sm transition-colors flex-shrink-0">
        历史卡住归档
      </button>

      <button @click="uiStore.toggleStuckBanner()"
        class="p-1.5 rounded-md hover:bg-white/20 transition-colors flex-shrink-0" title="暂不提醒">
        <X :size="16" />
      </button>
    </div>

    <transition name="expand">
      <div v-if="expanded" class="relative border-t border-white/20 bg-alert-600/40 backdrop-blur-sm">
        <div class="px-6 py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div v-for="order in stuckList" :key="order.id"
            @click="router.push(getTargetPath(order))"
            class="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 cursor-pointer transition-all group">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-sm font-bold">{{ order.id }}</span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-white/20">
                {{ stuckTypeText[order.stuckRecord?.stuckType || 'OTHER'] }}
              </span>
            </div>
            <div class="text-sm mb-1 line-clamp-1">{{ order.customerName }}</div>
            <div class="text-[12px] opacity-90 mb-2 line-clamp-2">{{ order.stuckRecord?.reason }}</div>
            <div class="flex items-center justify-between text-[11px] opacity-80">
              <span>已卡 <b class="data-num">{{ getDurationHours(order.stuckRecord?.stuckAt || '') }}</b></span>
              <span class="group-hover:translate-x-1 transition-transform">前往处理 →</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
