<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, AlertTriangle, CheckCircle, FileText, ChevronDown, ChevronRight, History, Clock, Eye } from 'lucide-vue-next'
import { ElButton, ElSelect, ElOption, ElInput, ElDatePicker, ElTabs, ElTabPane, ElTimeline, ElTimelineItem, ElDrawer, ElTag } from 'element-plus'
import { useOrdersStore } from '@/stores/orders'
import { useUiStore } from '@/stores/ui'
import StatusTag from '@/components/common/StatusTag.vue'
import OrderDetailDrawer from '@/components/sales/OrderDetailDrawer.vue'
import { formatDateTime, getDurationHours, stuckTypeText } from '@/utils'
import dayjs from 'dayjs'
import type { RoleType, OrderStatus, StuckType } from '@/types'

const ordersStore = useOrdersStore()
const uiStore = useUiStore()

const searchText = ref('')
const dateRange = ref<any>(null)
const roleFilter = ref<RoleType | ''>('')
const statusFilter = ref<OrderStatus | ''>('')
const stuckTypeFilter = ref<StuckType | ''>('')
const activeTab = ref('all')
const timelineOrderId = ref<string | null>(null)
const timelineDrawerVisible = ref(false)
const expandedMap = ref<Record<string, boolean>>({})

const allOrders = computed(() => ordersStore.orders.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))

const filteredOrders = computed(() => {
  let list = allOrders.value
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.logisticsNo || '').toLowerCase().includes(q),
    )
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const [s, e] = dateRange.value
    list = list.filter((o) => {
      const t = dayjs(o.updatedAt.slice(0, 10))
      return t.isAfter(s.subtract(1, 'day')) && t.isBefore(e.add(1, 'day'))
    })
  }
  if (roleFilter.value) list = list.filter((o) => o.operator === roleFilter.value)
  if (statusFilter.value) list = list.filter((o) => o.status === statusFilter.value)
  return list
})

const stuckRecords = computed(() => {
  const records: any[] = []
  ordersStore.orders.forEach((o) => {
    if (o.stuckRecord) {
      records.push({
        ...o.stuckRecord,
        order: o,
        isActive: !o.stuckRecord!.resolvedAt,
        duration: getDurationHours(o.stuckRecord!.stuckAt, o.stuckRecord!.resolvedAt),
      })
    }
  })
  return records.sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
})

const activeStuckCount = computed(() => stuckRecords.value.filter((s) => s.isActive).length)
const resolvedStuckCount = computed(() => stuckRecords.value.filter((s) => !s.isActive).length)

const activeStuckOnly = computed(() => {
  if (stuckTypeFilter.value) return stuckRecords.value.filter((s) => s.stuckType === stuckTypeFilter.value)
  return stuckRecords.value
})

function toggleExpand(id: string) { expandedMap.value[id] = !expandedMap.value[id] }
function isExpanded(id: string) { return expandedMap.value[id] }
function openTimeline(orderId: string) { timelineOrderId.value = orderId; timelineDrawerVisible.value = true }
function openDetail(id: string) { uiStore.openOrderDrawer(id) }

const timelineLogs = computed(() => timelineOrderId.value ? ordersStore.getLogsByOrderId(timelineOrderId.value) : [])
const timelineOrder = computed(() => timelineOrderId.value ? ordersStore.getOrderById(timelineOrderId.value) : null)
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <div class="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800 mb-1 flex items-center gap-2">
          <History :size="22" class="text-base-500" />
          历史记录与流程回看
        </h2>
        <p class="text-sm text-neutral-500">全流程操作日志、卡住记录归档、单笔订单时间线追溯</p>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold data-num text-neutral-700">{{ allOrders.length }}</div>
          <div class="text-[11px] text-neutral-500">总记录</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold data-num text-success-600">{{ resolvedStuckCount }}</div>
          <div class="text-[11px] text-neutral-500">已解决卡住</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold data-num text-alert-600 animate-pulse-soft">{{ activeStuckCount }}</div>
          <div class="text-[11px] text-neutral-500">仍在卡住</div>
        </div>
      </div>
    </div>

    <div class="workspace-card p-4 mb-5">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div class="md:col-span-2">
          <label class="text-xs text-neutral-500 block mb-1">关键词搜索</label>
          <ElInput v-model="searchText" placeholder="订单号/客户/物流单号" clearable :prefix-icon="Search" size="default" />
        </div>
        <div>
          <label class="text-xs text-neutral-500 block mb-1">日期范围</label>
          <ElDatePicker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" size="default" style="width: 100%" />
        </div>
        <div>
          <label class="text-xs text-neutral-500 block mb-1">操作角色</label>
          <ElSelect v-model="roleFilter" placeholder="全部" clearable size="default" style="width: 100%">
            <ElOption label="销售内勤" value="SALES" />
            <ElOption label="种植员" value="GROWER" />
            <ElOption label="包装主管" value="PACKER" />
          </ElSelect>
        </div>
        <div>
          <label class="text-xs text-neutral-500 block mb-1">订单状态</label>
          <ElSelect v-model="statusFilter" placeholder="全部" clearable size="default" style="width: 100%">
            <ElOption label="待确认" value="PENDING_CONFIRM" />
            <ElOption label="采切中" value="HARVESTING" />
            <ElOption label="包装中" value="PACKING" />
            <ElOption label="已完成" value="COMPLETED" />
            <ElOption label="卡住" value="STUCK" />
          </ElSelect>
        </div>
      </div>
    </div>

    <ElTabs v-model="activeTab" type="border-card" class="workspace-card">
      <ElTabPane name="all">
        <template #label>
          <span class="flex items-center gap-1.5">
            <FileText :size="14" />
            全部订单流水
            <span class="data-num text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 ml-1">{{ filteredOrders.length }}</span>
          </span>
        </template>
        <div class="space-y-2 p-1">
          <div v-if="filteredOrders.length === 0" class="py-16 text-center text-neutral-400">暂无符合条件的记录</div>
          <div v-for="order in filteredOrders" :key="order.id"
            class="rounded-xl border transition-all"
            :class="order.status === 'STUCK'
              ? 'bg-alert-50/50 border-alert-200 hover:border-alert-400'
              : 'bg-white border-neutral-200 hover:border-base-300 hover:shadow-card'">
            <div class="flex flex-wrap items-center gap-3 p-4 cursor-pointer" @click="toggleExpand(order.id)">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="order.status === 'COMPLETED' ? 'bg-success-50 text-success-500' : order.status === 'STUCK' ? 'bg-alert-50 text-alert-500' : 'bg-base-50 text-base-500'">
                <CheckCircle v-if="order.status === 'COMPLETED'" :size="16" />
                <AlertTriangle v-else-if="order.status === 'STUCK'" :size="16" />
                <Clock v-else :size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-0.5">
                  <span class="font-mono font-semibold text-neutral-800 data-num">{{ order.id }}</span>
                  <StatusTag type="order" :value="order.status" size="sm" />
                  <span class="text-sm font-medium text-neutral-700">{{ order.customerName }}</span>
                  <span v-if="order.stuckRecord" class="text-[11px] px-2 py-0.5 rounded bg-alert-100 text-alert-700 border border-alert-200">
                    卡住: {{ stuckTypeText[order.stuckRecord.stuckType] }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
                  <span>配送 {{ order.deliveryDate }}</span>
                  <span>·</span>
                  <span>金额 ¥<span class="data-num">{{ order.totalAmount.toLocaleString() }}</span></span>
                  <span>·</span>
                  <span>共 {{ order.items.reduce((s, i) => s + i.quantity, 0) }} 扎</span>
                  <span>·</span>
                  <span>最后更新 {{ formatDateTime(order.updatedAt) }}</span>
                  <span v-if="order.logisticsNo">· 单号 <span class="font-mono data-num">{{ order.logisticsNo }}</span></span>
                </div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0" @click.stop>
                <ElButton link size="small" type="primary" @click="openTimeline(order.id)"><Clock :size="12" class="mr-1" />时间线</ElButton>
                <ElButton link size="small" @click="openDetail(order.id)"><Eye :size="12" class="mr-1" />详情</ElButton>
              </div>
              <div class="w-6 flex justify-center text-neutral-400 flex-shrink-0">
                <ChevronDown v-if="isExpanded(order.id)" :size="16" />
                <ChevronRight v-else :size="16" />
              </div>
            </div>
            <transition name="expand">
              <div v-if="isExpanded(order.id)" class="border-t border-neutral-100 p-4 bg-neutral-50/50">
                <div class="text-xs font-semibold text-neutral-600 mb-3 flex items-center gap-1">
                  <Clock :size="12" /> 操作时间线
                </div>
                <ElTimeline>
                  <ElTimelineItem v-for="log in ordersStore.getLogsByOrderId(order.id)" :key="log.id"
                    :type="log.isStuck ? 'danger' : 'primary'"
                    :hollow="false"
                    :timestamp="formatDateTime(log.timestamp)"
                    placement="top">
                    <div class="flex flex-wrap items-center gap-2 mb-0.5">
                      <StatusTag type="role" :value="log.role" size="sm" />
                      <span class="text-sm font-medium text-neutral-800">{{ log.operatorName }}</span>
                      <ElTag v-if="log.isStuck" type="danger" size="small" effect="dark">卡住节点</ElTag>
                    </div>
                    <div class="text-[13px] text-neutral-700">{{ log.action }}</div>
                    <div class="text-[12px] text-neutral-500 mt-0.5">{{ log.detail }}</div>
                  </ElTimelineItem>
                </ElTimeline>
              </div>
            </transition>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane name="stuck">
        <template #label>
          <span class="flex items-center gap-1.5">
            <AlertTriangle :size="14" class="text-alert-500" />
            卡住记录专区
            <span class="data-num text-[11px] px-1.5 py-0.5 rounded-full bg-alert-100 text-alert-600 ml-1 animate-pulse-soft">{{ stuckRecords.length }}</span>
          </span>
        </template>
        <div class="mb-4 flex flex-wrap items-center gap-3 p-2">
          <span class="text-xs text-neutral-500">卡住类型:</span>
          <ElTag :type="!stuckTypeFilter ? 'danger' : 'info'" :effect="!stuckTypeFilter ? 'dark' : 'plain'" round class="cursor-pointer" @click="stuckTypeFilter = ''">全部</ElTag>
          <template v-for="(label, key) in stuckTypeText" :key="key">
            <ElTag :type="stuckTypeFilter === key ? 'danger' : 'info'" effect="plain" round class="cursor-pointer" @click="stuckTypeFilter = stuckTypeFilter === key ? '' : (key as any)">
              {{ label }}
            </ElTag>
          </template>
          <span class="ml-auto text-xs text-neutral-500">
            进行中 <b class="text-alert-600 data-num">{{ activeStuckCount }}</b> ·
            已解决 <b class="text-success-600 data-num">{{ resolvedStuckCount }}</b>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
          <div v-if="activeStuckOnly.length === 0" class="col-span-full py-16 text-center text-neutral-400">暂无卡住记录</div>
          <div v-for="s in activeStuckOnly" :key="s.id"
            @click="openDetail(s.orderId)"
            class="rounded-xl p-4 border transition-all cursor-pointer hover:shadow-card"
            :class="s.isActive
              ? 'bg-gradient-to-br from-alert-50 to-white border-alert-200 stuck-card'
              : 'bg-white border-neutral-200 hover:border-success-300'">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="s.isActive" class="w-2 h-2 rounded-full bg-alert-500 animate-pulse-soft" />
                <StatusTag type="stuck" :value="s.stuckType" size="sm" />
                <span class="font-mono font-bold text-sm data-num text-neutral-800">{{ s.orderId }}</span>
              </div>
              <ElTag v-if="s.isActive" type="danger" effect="dark" size="small" round>进行中 · {{ s.duration }}</ElTag>
              <ElTag v-else type="success" effect="light" size="small" round>已解决 · {{ s.duration }}</ElTag>
            </div>
            <div class="text-sm font-medium text-neutral-800 mb-1">{{ s.order?.customerName }}</div>
            <div class="text-sm text-alert-700 mb-2 bg-alert-50 border border-alert-100 rounded p-2">
              📝 {{ s.reason }}
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px] text-neutral-500 mb-3">
              <div><span class="opacity-70">卡住时间:</span> <span class="data-num">{{ formatDateTime(s.stuckAt) }}</span></div>
              <div v-if="s.resolvedAt"><span class="opacity-70">恢复时间:</span> <span class="data-num">{{ formatDateTime(s.resolvedAt) }}</span></div>
              <div><span class="opacity-70">卡住环节:</span> <span class="text-neutral-700">{{ s.order?.previousStatus ? (s.order.previousStatus === 'PACKING' ? '包装' : s.order.previousStatus === 'HARVESTING' ? '采切' : '销售') : '-' }}</span></div>
              <div v-if="s.resolver"><span class="opacity-70">处理人:</span> <span class="text-neutral-700">{{ s.resolver }}</span></div>
            </div>
            <div v-if="s.resolution" class="text-[11px] p-2 rounded bg-success-50 border border-success-100 text-success-700">
              ✅ 处理措施: {{ s.resolution }}
            </div>
            <div v-else class="text-[11px] p-2 rounded bg-gold-50 border border-gold-100 text-gold-700">
              ⏳ 等待相关岗位处理...
            </div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <ElDrawer v-model="timelineDrawerVisible" title="流程时间线回看" direction="rtl" size="480px" destroy-on-close>
      <div v-if="timelineOrder" class="mb-4 p-3 rounded-lg bg-base-50 border border-base-200">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-mono font-bold data-num">{{ timelineOrder.id }}</span>
          <StatusTag type="order" :value="timelineOrder.status" size="sm" />
        </div>
        <div class="text-xs text-neutral-600">{{ timelineOrder.customerName }} · 配送 {{ timelineOrder.deliveryDate }}</div>
      </div>
      <ElTimeline v-if="timelineLogs.length > 0">
        <ElTimelineItem v-for="log in timelineLogs" :key="log.id"
          :type="log.isStuck ? 'danger' : 'primary'"
          :hollow="false"
          :timestamp="formatDateTime(log.timestamp)"
          placement="top">
          <div class="flex flex-wrap items-center gap-2 mb-0.5">
            <StatusTag type="role" :value="log.role" size="sm" />
            <span class="text-sm font-semibold text-neutral-800">{{ log.operatorName }}</span>
            <ElTag v-if="log.isStuck" type="danger" size="small" effect="dark">卡住</ElTag>
          </div>
          <div class="text-[13px] text-neutral-800 font-medium">{{ log.action }}</div>
          <div class="text-[12px] text-neutral-500 mt-1 leading-relaxed">{{ log.detail }}</div>
        </ElTimelineItem>
      </ElTimeline>
      <div v-else class="text-center py-12 text-neutral-400">暂无操作日志</div>
    </ElDrawer>

    <OrderDetailDrawer v-model="uiStore.drawerVisible" :order-id="uiStore.selectedOrderId" />
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; margin: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 2000px; }
</style>
