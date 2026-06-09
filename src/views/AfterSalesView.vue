<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Filter } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useRoleStore } from '@/stores/role'
import { STATUS_LABELS, ROLE_LABELS } from '@/types'
import type { OrderStatus, UserRole } from '@/types'
import OrderCard from '@/components/OrderCard.vue'
import OrderDetailPanel from '@/components/OrderDetailPanel.vue'

const ordersStore = useOrdersStore()
const roleStore = useRoleStore()

const searchText = ref('')
const filterRole = ref<UserRole | 'all'>('all')
const filterStatus = ref<OrderStatus | 'all'>('all')

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'warehousing', label: '仓库处理中' },
  { value: 'fee_adjusting', label: '费用调整中' },
  { value: 'completed', label: '已完成' },
]

const roleOptions: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: '全部角色' },
  { value: 'sales_clerk', label: '销售内勤' },
  { value: 'warehouse', label: '仓库员' },
  { value: 'after_sales', label: '售后专员' },
]

const filteredOrders = computed(() => {
  let list = ordersStore.orders
  if (filterRole.value !== 'all') {
    list = list.filter((o) => o.assignedRole === filterRole.value)
  }
  if (filterStatus.value !== 'all') {
    list = list.filter((o) => o.status === filterStatus.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
    )
  }
  return list.sort((a, b) => {
    if (a.isStuck && !b.isStuck) return -1
    if (!a.isStuck && b.isStuck) return 1
    return 0
  })
})

const stuckCount = computed(() => filteredOrders.value.filter((o) => o.isStuck).length)

const pendingCount = computed(() =>
  filteredOrders.value.filter(
    (o) => o.assignedRole === roleStore.currentRole && o.status !== 'completed' && o.status !== 'rejected'
  ).length
)

function handleCardClick(orderId: string) {
  ordersStore.selectOrder(orderId)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-[#1B4965]">售后退换处理</h1>
        <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>当前角色：<span class="font-medium text-[#1B4965]">{{ roleStore.roleLabel }}</span></span>
          <span>·</span>
          <span>待办：<span class="font-medium text-[#E8871E]">{{ pendingCount }}</span></span>
          <span v-if="stuckCount > 0">·</span>
          <span v-if="stuckCount > 0" class="text-red-500 font-medium">卡单：{{ stuckCount }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-xs">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchText"
          placeholder="搜索单号、客户、产品..."
          class="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965]"
        />
      </div>
      <div class="flex items-center gap-1.5">
        <Filter :size="14" class="text-gray-400" />
        <select
          v-model="filterRole"
          class="rounded-lg border border-[#E2E8F0] text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965] bg-white"
        >
          <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select
          v-model="filterStatus"
          class="rounded-lg border border-[#E2E8F0] text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965] bg-white"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-3 pr-1">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @click="handleCardClick(order.id)"
        @view-evidence="handleCardClick(order.id)"
      />
      <div
        v-if="filteredOrders.length === 0"
        class="flex items-center justify-center py-16 text-gray-400 text-sm"
      >
        暂无匹配的售后退换单据
      </div>
    </div>

    <OrderDetailPanel />
  </div>
</template>
