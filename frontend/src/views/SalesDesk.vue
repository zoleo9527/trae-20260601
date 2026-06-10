<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Search, Plus, Filter, Eye, CheckCircle, Edit3, AlertTriangle, TrendingUp } from 'lucide-vue-next'
import { ElTable, ElTableColumn, ElButton, ElInput, ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import StatusTag from '@/components/common/StatusTag.vue'
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer.vue'
import { formatDateTime, cn } from '@/utils'
import type { OrderStatus } from '@/types'

const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const searchText = ref('')
const activeTab = ref<string>('ALL')

const statusTabs: { key: string; label: string; status?: OrderStatus[] }[] = [
  { key: 'ALL', label: '全部订单' },
  { key: 'TODO', label: '我的待办', status: ['PENDING_CONFIRM', 'STUCK'] },
  { key: 'PROCESSING', label: '进行中', status: ['CONFIRMED', 'HARVESTING', 'PACKING'] },
  { key: 'DONE', label: '已完成', status: ['COMPLETED'] },
  { key: 'STUCK', label: '卡住异常', status: ['STUCK'] },
]

const displayedOrders = computed(() => {
  let list = ordersStore.orders
  // 搜索
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q),
    )
  }
  // tab 过滤
  const tab = statusTabs.find((t) => t.key === activeTab.value)
  if (tab?.status) {
    list = list.filter((o) => tab.status!.includes(o.status))
  }
  // 按更新时间倒序
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const tabCount = (status?: OrderStatus[]) => {
  if (!status) return ordersStore.orders.length
  return ordersStore.orders.filter((o) => status.includes(o.status)).length
}

function rowClassName({ row }: any) {
  if (row.status === 'STUCK') return 'danger-row'
  if (row.status === 'PENDING_CONFIRM') return 'warning-row'
  return ''
}

function openDetail(orderId: string) {
  uiStore.openOrderDrawer(orderId)
}

function handleConfirm(row: any) {
  ordersStore.confirmOrder(row.id)
  ElMessage.success(`已确认订单 ${row.id},采切排期自动推送至种植员工作台`)
}
function handleChangeSpec(row: any) {
  ElMessageBox.prompt(`当前订单 ${row.id} 修改规格:`, '客户改规格', {
    confirmButtonText: '确认修改',
    cancelButtonText: '取消',
    inputValue: '',
    inputPlaceholder: '请输入修改后的规格描述...',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.addLog(row.id, 'SALES', '销售-小林', '修改规格', value.trim())
        ElMessage.success('规格已更新,操作已记录')
      }
    })
    .catch(() => {})
}
function handleMarkStuck(row: any) {
  ElMessageBox.prompt(`标记订单 ${row.id} 为异常卡住,请输入原因:`, '标记卡住', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputValue: '',
    inputPlaceholder: '例如: 客户临时改规格,待确认...',
  })
    .then(({ value }) => {
      if (value && value.trim()) {
        ordersStore.reportStuck(row.id, {
          stuckType: 'CUSTOMER_CHANGE',
          reason: value.trim(),
          previousStatus: row.status,
        })
        ElMessage.warning('已标记为卡住,全岗可见')
      }
    })
    .catch(() => {})
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <!-- 顶部统计卡 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">本月订单数</span>
          <div class="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center text-gold-500"><FileText :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-gold-600">{{ ordersStore.orders.length }}</span>
          <span class="text-xs text-success-600 flex items-center gap-0.5"><TrendingUp :size="11" /> +12%</span>
        </div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">已完成关闭</span>
          <div class="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center text-success-500"><CheckCircle :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-success-600">{{ ordersStore.orders.filter(o => o.status === 'COMPLETED').length }}</span>
          <span class="text-xs text-neutral-500">单</span>
        </div>
      </div>
      <div class="workspace-card p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">进行中</span>
          <div class="w-8 h-8 rounded-lg bg-base-50 flex items-center justify-center text-base-500"><Eye :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-base-700">{{ ordersStore.orders.filter(o => ['CONFIRMED', 'HARVESTING', 'PACKING'].includes(o.status)).length }}</span>
          <span class="text-xs text-neutral-500">单</span>
        </div>
      </div>
      <div class="workspace-card p-4 border-alert-200" :class="ordersStore.stuckCount > 0 ? 'stuck-card' : ''">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-neutral-500">卡住待处理</span>
          <div class="w-8 h-8 rounded-lg bg-alert-50 flex items-center justify-center text-alert-500"><AlertTriangle :size="16" /></div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold data-num text-alert-600">{{ ordersStore.stuckCount }}</span>
          <span class="text-xs text-alert-600">需处理</span>
        </div>
      </div>
    </div>

    <!-- 搜索+Tab -->
    <div class="workspace-card p-4 mb-5">
      <div class="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div class="relative flex-1 max-w-md">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <ElInput v-model="searchText" placeholder="搜索订单号/客户名/手机号..." clearable class="pl-7" />
        </div>
        <div class="flex gap-2 ml-auto">
          <ElButton :icon="Filter" size="small">高级筛选</ElButton>
          <ElButton type="primary" :icon="Plus" size="small">新建订单</ElButton>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 border-b border-neutral-200 pb-0">
        <button v-for="tab in statusTabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-all"
          :class="activeTab === tab.key
            ? 'border-base-500 text-base-700'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'">
          {{ tab.label }}
          <span class="ml-1.5 data-num text-[11px] px-1.5 py-0.5 rounded-full"
            :class="activeTab === tab.key ? 'bg-base-50 text-base-600' : 'bg-neutral-100 text-neutral-500'">
            {{ tabCount(tab.status) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 订单流水表 -->
    <div class="workspace-card overflow-hidden">
      <ElTable :data="displayedOrders"
        stripe
        :row-class-name="rowClassName"
        style="width: 100%"
        empty-text="暂无订单数据"
        @row-click="(row) => openDetail(row.id)">
        <ElTableColumn prop="id" label="订单号" width="150">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-sm text-neutral-800 data-num cursor-pointer hover:text-base-600">{{ row.id }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="customerName" label="客户" width="150">
          <template #default="{ row }">
            <div>
              <div class="text-sm font-medium text-neutral-800">{{ row.customerName }}</div>
              <div class="text-[11px] text-neutral-500">{{ row.phone }}</div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="花卉品种" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <ElTag v-for="it in row.items" :key="it.id" size="small" effect="plain" type="success" round>
                {{ it.flowerType }}{{ it.color }} ×{{ it.quantity }}扎
              </ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="deliveryDate" label="配送日期" width="120">
          <template #default="{ row }">
            <span class="data-num text-sm text-neutral-700">{{ row.deliveryDate }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="totalAmount" label="金额" width="110" align="right">
          <template #default="{ row }">
            <span class="data-num font-semibold text-base-700">¥{{ row.totalAmount.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <StatusTag type="order" :value="row.status" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="150">
          <template #default="{ row }">
            <span class="data-num text-xs text-neutral-500">{{ formatDateTime(row.updatedAt) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="260" fixed="right" align="right" @click.stop>
          <template #default="{ row }">
            <div class="flex items-center gap-1 justify-end flex-wrap">
              <ElButton link size="small" type="primary" @click.stop="openDetail(row.id)">详情</ElButton>
              <ElButton v-if="row.status === 'PENDING_CONFIRM'" link size="small" type="success" @click.stop="handleConfirm(row)">确认</ElButton>
              <ElButton v-if="row.status !== 'COMPLETED' && row.status !== 'STUCK'" link size="small" type="warning" @click.stop="handleChangeSpec(row)">改规格</ElButton>
              <ElButton v-if="row.status !== 'COMPLETED' && row.status !== 'STUCK'" link size="small" type="danger" @click.stop="handleMarkStuck(row)">标异常</ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- 订单详情抽屉 -->
    <OrderDetailDrawer v-model="uiStore.drawerVisible" :order-id="uiStore.selectedOrderId" />
  </div>
</template>
