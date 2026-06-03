<script setup lang="ts">
import { ref, computed } from 'vue'
import { Truck, Package, Clock, CheckCircle2, ChevronDown, ChevronUp, Copy, Link } from 'lucide-vue-next'
import { useShippingStore } from '@/stores/shipping'
import { useOrderStore } from '@/stores/order'
import { useStaffStore } from '@/stores/staff'
import { useToastStore } from '@/stores/toast'
import ModalDialog from '@/components/shared/ModalDialog.vue'
import type { ShippingRecord } from '@/types'

const shippingStore = useShippingStore()
const orderStore = useOrderStore()
const staffStore = useStaffStore()
const toastStore = useToastStore()

type TabKey = 'pending' | 'shipped' | 'delivered'
const activeTab = ref<TabKey>('pending')

const tabs = computed<{ key: TabKey; label: string; count: number }[]>(() => [
  { key: 'pending', label: '待回寄', count: shippingStore.pendingShipments.length },
  { key: 'shipped', label: '已寄出', count: shippingStore.shippedRecords.length },
  { key: 'delivered', label: '已签收', count: shippingStore.deliveredRecords.length },
])

const currentList = computed(() => {
  if (activeTab.value === 'pending') return shippingStore.pendingShipments
  if (activeTab.value === 'shipped') return shippingStore.shippedRecords
  return shippingStore.deliveredRecords
})

const initModalOpen = ref(false)
const initTarget = ref<ShippingRecord | null>(null)
const selectedCarrier = ref('顺丰速运')
const carrierOptions = ['顺丰速运', '中通快递', '圆通速递']

function openInitModal(record: ShippingRecord) {
  initTarget.value = record
  selectedCarrier.value = '顺丰速运'
  initModalOpen.value = true
}

function submitInit() {
  if (!initTarget.value) return
  shippingStore.initShipping(initTarget.value.orderId, selectedCarrier.value, initTarget.value.assignedCs)
  toastStore.addToast({ type: 'success', title: '回寄已发起', message: '回寄已发起，快递单号已生成' })
  initModalOpen.value = false
}

function handleMarkDelivered(id: string) {
  shippingStore.markDelivered(id)
  toastStore.addToast({ type: 'success', title: '签收确认', message: '已确认签收' })
}

const expandedIds = ref<Set<string>>(new Set())

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

const statusChain = [
  { key: 'pending_design', label: '接单' },
  { key: 'designing', label: '设计' },
  { key: 'pending_qc', label: '质检' },
  { key: 'passed', label: '放行' },
  { key: 'pending_shipping', label: '回寄' },
  { key: 'delivered', label: '签收' },
] as const

const statusOrder: string[] = [
  'pending_design',
  'designing',
  'pending_qc',
  'qc_in_progress',
  'passed',
  'pending_shipping',
  'shipped',
  'delivered',
]

function getChainStepState(orderStatus: string, stepKey: string) {
  let orderIdx = statusOrder.indexOf(orderStatus)
  if (orderIdx < 0) return 'future'
  if (orderStatus === 'passed') {
    orderIdx = statusOrder.indexOf('pending_shipping')
  }
  const stepIdx = statusOrder.indexOf(stepKey)
  if (stepIdx < 0) return 'future'
  if (stepIdx < orderIdx) return 'completed'
  if (stepIdx === orderIdx) return 'current'
  if (orderStatus === 'shipped' && stepKey === 'delivered') return 'current'
  return 'future'
}

function getStaffForStep(order: any, stepKey: string) {
  if (stepKey === 'pending_design' || stepKey === 'designing') return order.assignedDesigner
  if (stepKey === 'pending_qc' || stepKey === 'qc_in_progress') return order.assignedQc
  if (stepKey === 'passed' || stepKey === 'pending_shipping') return order.assignedCs
  if (stepKey === 'delivered') return order.assignedCs
  return ''
}

function formatTime(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function copyTracking(no: string) {
  navigator.clipboard.writeText(no)
  toastStore.addToast({ type: 'info', title: '已复制', message: `快递单号 ${no} 已复制到剪贴板` })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-flow-blue/10">
        <Truck :size="22" class="text-flow-blue" />
      </div>
      <h1 class="text-xl font-semibold text-white">客户回寄追踪</h1>
    </div>

    <div class="flex gap-1 p-1 rounded-lg bg-factory-surface">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
          activeTab === tab.key
            ? 'bg-factory-surface-light text-white shadow'
            : 'text-gray-400 hover:text-gray-300',
        ]"
      >
        {{ tab.label }}
        <span
          :class="[
            'ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs',
            activeTab === tab.key ? 'bg-flow-blue/20 text-flow-blue' : 'bg-factory-border text-gray-500',
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="space-y-3">
      <div v-if="currentList.length === 0" class="py-12 text-center text-gray-500">
        暂无记录
      </div>

      <div
        v-for="record in currentList"
        :key="record.id"
        class="rounded-xl border bg-factory-surface border-factory-border animate-slide-up"
      >
        <div class="p-4">
          <div v-if="activeTab === 'pending'" class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <Package :size="16" class="text-warn-orange" />
                  <span class="font-mono text-sm text-flow-blue cursor-pointer hover:underline">
                    {{ record.orderId }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-400">
                  <span>承运商：{{ record.carrier }}</span>
                  <span>负责客服：{{ staffStore.getStaffById(record.assignedCs)?.name ?? '-' }}</span>
                </div>
                <div v-if="record.reason" class="text-xs text-warn-yellow">
                  原因：{{ record.reason }}
                </div>
              </div>
              <button
                @click="openInitModal(record)"
                class="px-4 py-1.5 text-sm font-medium text-white rounded-lg bg-pass-green hover:bg-pass-green/90 transition-colors"
              >
                发起回寄
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'shipped'" class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <Package :size="16" class="text-flow-blue" />
                  <span class="font-mono text-sm text-flow-blue cursor-pointer hover:underline">
                    {{ record.orderId }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm tracking-wider text-white bg-factory-surface-light px-2 py-0.5 rounded">
                    {{ record.trackingNo }}
                  </span>
                  <button
                    @click="copyTracking(record.trackingNo)"
                    class="p-1 rounded hover:bg-factory-border-light transition-colors"
                  >
                    <Copy :size="14" class="text-gray-400" />
                  </button>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-400">
                  <span>{{ record.carrier }}</span>
                  <span class="flex items-center gap-1">
                    <Clock :size="12" />
                    {{ formatTime(record.shippedAt) }}
                  </span>
                </div>
              </div>
              <button
                @click="handleMarkDelivered(record.id)"
                class="px-4 py-1.5 text-sm font-medium text-white rounded-lg bg-pass-green hover:bg-pass-green/90 transition-colors"
              >
                确认签收
              </button>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <CheckCircle2 :size="16" class="text-pass-green" />
                  <span class="font-mono text-sm text-flow-blue cursor-pointer hover:underline">
                    {{ record.orderId }}
                  </span>
                  <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-pass-green/15 text-pass-green">
                    已完成
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm tracking-wider text-gray-300 bg-factory-surface-light px-2 py-0.5 rounded">
                    {{ record.trackingNo }}
                  </span>
                  <button
                    @click="copyTracking(record.trackingNo)"
                    class="p-1 rounded hover:bg-factory-border-light transition-colors"
                  >
                    <Copy :size="14" class="text-gray-400" />
                  </button>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-400">
                  <span>{{ record.carrier }}</span>
                  <span>寄出：{{ formatTime(record.shippedAt) }}</span>
                  <span>签收：{{ formatTime(record.deliveredAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-factory-border">
            <button
              @click="toggleExpand(record.id)"
              class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              <component :is="expandedIds.has(record.id) ? ChevronUp : ChevronDown" :size="14" />
              回看详情
            </button>
          </div>
        </div>

        <div v-if="expandedIds.has(record.id)" class="px-4 pb-4 animate-slide-up">
          <template v-if="orderStore.orders.find((o) => o.id === record.orderId)">
            <div class="relative pl-6 space-y-0">
              <div
                v-for="(step, idx) in statusChain"
                :key="step.key"
                class="relative pb-4 last:pb-0"
              >
                <div
                  :class="[
                    'absolute left-[-22px] top-1 w-3 h-3 rounded-full border-2',
                    getChainStepState(orderStore.orders.find((o) => o.id === record.orderId)!.status, step.key) === 'completed'
                      ? 'bg-pass-green border-pass-green'
                      : getChainStepState(orderStore.orders.find((o) => o.id === record.orderId)!.status, step.key) === 'current'
                        ? 'bg-warn-orange border-warn-orange'
                        : 'bg-factory-border border-factory-border',
                  ]"
                />
                <div
                  v-if="idx < statusChain.length - 1"
                  :class="[
                    'absolute left-[-17px] top-4 w-0.5 h-full',
                    getChainStepState(orderStore.orders.find((o) => o.id === record.orderId)!.status, step.key) === 'completed'
                      ? 'bg-pass-green/50'
                      : 'bg-factory-border',
                  ]"
                />
                <div class="flex items-center gap-3 text-sm">
                  <span
                    :class="[
                      getChainStepState(orderStore.orders.find((o) => o.id === record.orderId)!.status, step.key) === 'future'
                        ? 'text-gray-500'
                        : 'text-white',
                    ]"
                  >
                    {{ step.label }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ staffStore.getStaffById(getStaffForStep(orderStore.orders.find((o) => o.id === record.orderId)!, step.key))?.name ?? '' }}
                  </span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="text-sm text-gray-500">未找到关联订单</div>
        </div>
      </div>
    </div>

    <ModalDialog v-model="initModalOpen" title="发起回寄">
      <div class="space-y-4" v-if="initTarget">
        <div class="text-sm text-gray-400">
          工单：<span class="font-mono text-white">{{ initTarget.orderId }}</span>
        </div>
        <div class="space-y-2">
          <label class="block text-sm text-gray-300">选择承运商</label>
          <select
            v-model="selectedCarrier"
            class="w-full px-3 py-2 rounded-lg bg-factory-surface-light border border-factory-border text-white text-sm focus:outline-none focus:border-flow-blue"
          >
            <option v-for="c in carrierOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="initModalOpen = false"
            class="px-4 py-2 text-sm text-gray-400 rounded-lg hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            @click="submitInit"
            class="px-4 py-2 text-sm font-medium text-white rounded-lg bg-pass-green hover:bg-pass-green/90 transition-colors"
          >
            确认发起
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>
