<template>
  <div class="h-full flex flex-col bg-[#F7F9FC]">
    <StuckAlert
      :count="stuckOrdersForRole.length"
      :stuck-orders="stuckOrdersForRole"
      @select="ordersStore.selectOrder"
    />

    <div class="flex gap-2 px-6 py-3">
      <button
        v-for="r in roleStore.roles"
        :key="r.value"
        :class="[
          'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          roleStore.currentRole === r.value
            ? 'bg-[#1B4965] text-white'
            : 'bg-white text-gray-600 border border-[#E2E8F0] hover:bg-gray-50',
        ]"
        @click="roleStore.switchRole(r.value)"
      >
        {{ r.label }}
        <span
          v-if="getPendingCount(r.value) > 0"
          class="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[#E8871E] text-white text-[10px] font-bold rounded-full"
        >
          {{ getPendingCount(r.value) }}
        </span>
        <span
          v-if="getStuckCount(r.value) > 0"
          class="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full"
          :style="getPendingCount(r.value) > 0 ? 'right: 18px' : ''"
        >
          {{ getStuckCount(r.value) }}
        </span>
      </button>
    </div>

    <div v-if="myTodoItems.length > 0" class="px-6 mb-3">
      <div class="bg-white rounded-xl border border-[#E8871E]/30 overflow-hidden shadow-sm">
        <div class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E8871E]/8 to-transparent border-b border-[#E8871E]/15">
          <ClipboardList :size="16" class="text-[#E8871E]" />
          <span class="text-sm font-bold text-[#E8871E]">我的待办</span>
          <span class="text-xs text-[#E8871E]/70">{{ myTodoItems.length }}项</span>
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in myTodoItems"
            :key="item.orderId"
            class="flex items-center gap-3 px-4 py-2.5 hover:bg-[#E8871E]/5 cursor-pointer transition-colors"
            @click="ordersStore.selectOrder(item.orderId)"
          >
            <div
              class="shrink-0 w-2 h-2 rounded-full"
              :class="item.isStuck ? 'bg-red-500 animate-pulse' : 'bg-[#E8871E]'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-[#1B4965]">{{ item.orderNo }}</span>
                <span v-if="item.isStuck" class="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">卡单</span>
                <span class="text-xs text-gray-400">{{ item.customerName }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5">{{ item.productName }}</div>
            </div>
            <div class="shrink-0 text-right">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8871E]/10 text-[#E8871E]">
                <ArrowRight :size="10" />
                {{ item.action }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 mb-2">
      <div class="flex items-center gap-4 text-sm text-gray-500">
        <span>当前角色：<span class="font-medium text-[#1B4965]">{{ roleStore.roleLabel }}</span></span>
        <span>·</span>
        <span>待办：<span class="font-medium text-[#E8871E]">{{ pending.length }}</span></span>
        <span>·</span>
        <span>进行中：<span class="font-medium text-[#1B4965]">{{ inProgress.length }}</span></span>
        <span>·</span>
        <span>已完成：<span class="font-medium text-[#2D936C]">{{ completed.length }}</span></span>
      </div>
    </div>

    <div class="flex-1 grid grid-cols-3 gap-4 px-6 pb-6 min-h-0">
      <KanbanColumn title="待处理" :count="pending.length" color="#E8871E">
        <OrderCard
          v-for="o in pending"
          :key="o.id"
          :order="o"
          @click="ordersStore.selectOrder(o.id)"
          @view-evidence="ordersStore.selectOrder(o.id)"
        />
      </KanbanColumn>
      <KanbanColumn title="进行中" :count="inProgress.length" color="#1B4965">
        <OrderCard
          v-for="o in inProgress"
          :key="o.id"
          :order="o"
          @click="ordersStore.selectOrder(o.id)"
          @view-evidence="ordersStore.selectOrder(o.id)"
        />
      </KanbanColumn>
      <KanbanColumn title="已完成" :count="completed.length" color="#2D936C">
        <OrderCard
          v-for="o in completed"
          :key="o.id"
          :order="o"
          @click="ordersStore.selectOrder(o.id)"
          @view-evidence="ordersStore.selectOrder(o.id)"
        />
      </KanbanColumn>
    </div>

    <OrderDetailPanel />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardList, ArrowRight } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useRoleStore } from '@/stores/role'
import type { UserRole } from '@/types'
import StuckAlert from '@/components/StuckAlert.vue'
import OrderCard from '@/components/OrderCard.vue'
import OrderDetailPanel from '@/components/OrderDetailPanel.vue'
import KanbanColumn from '@/components/KanbanColumn.vue'

const ordersStore = useOrdersStore()
const roleStore = useRoleStore()

const stuckOrdersForRole = computed(() =>
  ordersStore.getStuckByRole(roleStore.currentRole)
)

const roleOrders = computed(() =>
  ordersStore.getOrdersByRole(roleStore.currentRole)
)

const pending = computed(() =>
  roleOrders.value.filter((o) =>
    ['pending_review', 'rejected'].includes(o.status)
  ).sort((a, b) => {
    if (a.isStuck && !b.isStuck) return -1
    if (!a.isStuck && b.isStuck) return 1
    return 0
  })
)

const inProgress = computed(() =>
  roleOrders.value.filter((o) =>
    ['approved', 'warehousing', 'fee_adjusting'].includes(o.status)
  ).sort((a, b) => {
    if (a.isStuck && !b.isStuck) return -1
    if (!a.isStuck && b.isStuck) return 1
    return 0
  })
)

const completed = computed(() =>
  roleOrders.value.filter((o) => o.status === 'completed')
)

interface TodoItem {
  orderId: string
  orderNo: string
  customerName: string
  productName: string
  action: string
  isStuck: boolean
}

const roleActionMap: Record<UserRole, Record<string, string>> = {
  sales_clerk: {
    pending_review: '提交退换申请',
    rejected: '重新提交申请',
    completed: '归档处理',
    fee_adjusting: '确认费用调整',
  },
  warehouse: {
    approved: '确认换发出库',
    warehousing: '确认退回入库',
  },
  after_sales: {
    pending_review: '审核退换申请',
    approved: '发起费用调整',
    fee_adjusting: '修正费用调整',
  },
}

const myTodoItems = computed<TodoItem[]>(() => {
  const role = roleStore.currentRole
  const actionMap = roleActionMap[role]
  return ordersStore.orders
    .filter((o) => o.assignedRole === role && actionMap[o.status])
    .map((o) => ({
      orderId: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      productName: o.productName,
      action: actionMap[o.status],
      isStuck: o.isStuck,
    }))
    .sort((a, b) => {
      if (a.isStuck && !b.isStuck) return -1
      if (!a.isStuck && b.isStuck) return 1
      return 0
    })
})

function getPendingCount(role: UserRole) {
  return ordersStore.getOrdersByRole(role).filter(
    (o) => o.status !== 'completed'
  ).length
}

function getStuckCount(role: UserRole) {
  return ordersStore.getStuckByRole(role).length
}
</script>
