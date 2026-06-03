<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldCheck, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'
import { useStaffStore } from '@/stores/staff'
import { useExceptionStore } from '@/stores/exception'
import { useToastStore } from '@/stores/toast'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import ModalDialog from '@/components/shared/ModalDialog.vue'
import type { ExceptionType, ExceptionSeverity } from '@/types'

const orderStore = useOrderStore()
const staffStore = useStaffStore()
const exceptionStore = useExceptionStore()
const toastStore = useToastStore()

type TabKey = 'all' | 'pending_qc' | 'qc_in_progress' | 'passed' | 'rejected'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_qc', label: '待质检' },
  { key: 'qc_in_progress', label: '质检中' },
  { key: 'passed', label: '已放行' },
  { key: 'rejected', label: '已退回' },
]

const activeTab = ref<TabKey>('all')

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orderStore.orders
  return orderStore.orders.filter((o) => o.status === activeTab.value)
})

const showRejectModal = ref(false)
const showExceptionModal = ref(false)
const selectedOrderId = ref('')

const rejectionReason = ref('')

const exceptionForm = ref<{
  type: ExceptionType
  severity: ExceptionSeverity
  description: string
}>({
  type: 'color_mismatch',
  severity: 'medium',
  description: '',
})

const exceptionTypeOptions: { value: ExceptionType; label: string }[] = [
  { value: 'color_mismatch', label: '色差' },
  { value: 'shape_issue', label: '形态' },
  { value: 'bite_issue', label: '咬合' },
  { value: 'material_defect', label: '材质' },
  { value: 'other', label: '其他' },
]

const exceptionSeverityOptions: { value: ExceptionSeverity; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

function openRejectModal(orderId: string) {
  selectedOrderId.value = orderId
  rejectionReason.value = ''
  showRejectModal.value = true
}

function openExceptionModal(orderId: string) {
  selectedOrderId.value = orderId
  exceptionForm.value = { type: 'color_mismatch', severity: 'medium', description: '' }
  showExceptionModal.value = true
}

function handleStartQc(orderId: string) {
  orderStore.startQc(orderId)
  toastStore.addToast({ type: 'success', title: '操作成功', message: '已开始质检' })
}

function handlePass(orderId: string) {
  orderStore.passOrder(orderId)
  toastStore.addToast({ type: 'success', title: '已放行', message: '已放行，进入待回寄' })
}

function submitRejection() {
  if (!rejectionReason.value.trim()) return
  orderStore.rejectOrder(selectedOrderId.value, rejectionReason.value.trim())
  showRejectModal.value = false
  toastStore.addToast({ type: 'warning', title: '已退回', message: '已退回设计师' })
}

function submitException() {
  if (!exceptionForm.value.description.trim()) return
  exceptionStore.addException({
    orderId: selectedOrderId.value,
    type: exceptionForm.value.type,
    severity: exceptionForm.value.severity,
    description: exceptionForm.value.description.trim(),
    triggeredBy: staffStore.currentStaffId,
  })
  showExceptionModal.value = false
  toastStore.addToast({ type: 'warning', title: '已标记', message: '已标记异常' })
}

function handleReassign(orderId: string) {
  orderStore.reassignToDesigner(orderId)
  toastStore.addToast({ type: 'info', title: '已重新分配', message: '工单已重新分配至设计师' })
}

function staffName(id: string): string {
  return staffStore.getStaffById(id)?.name ?? id
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <ShieldCheck :size="28" class="text-warn-orange" />
      <h1 class="text-2xl font-bold text-gray-100">质检放行处理</h1>
    </div>

    <div class="flex gap-2 border-b border-factory-border pb-0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors relative',
          activeTab === tab.key
            ? 'text-warn-orange'
            : 'text-gray-400 hover:text-gray-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-warn-orange"
        />
      </button>
    </div>

    <div class="bg-factory-surface rounded-xl p-4 border border-factory-border">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-400 text-left border-b border-factory-border">
            <th class="pb-3 font-medium">工单号</th>
            <th class="pb-3 font-medium">患者</th>
            <th class="pb-3 font-medium">类型</th>
            <th class="pb-3 font-medium">设计师</th>
            <th class="pb-3 font-medium">质检员</th>
            <th class="pb-3 font-medium">状态</th>
            <th class="pb-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            class="border-b border-factory-border/50 hover:bg-factory-surface-light/50 transition-colors"
          >
            <td class="py-3 font-mono text-flow-blue">{{ order.id }}</td>
            <td class="py-3 text-gray-200">{{ order.patientName }}</td>
            <td class="py-3 text-gray-300">{{ order.designType }}</td>
            <td class="py-3 text-gray-300">{{ staffName(order.assignedDesigner) }}</td>
            <td class="py-3 text-gray-300">{{ staffName(order.assignedQc) }}</td>
            <td class="py-3"><StatusBadge :status="order.status" /></td>
            <td class="py-3 text-right">
              <div v-if="order.status === 'pending_qc' || order.status === 'qc_in_progress'" class="flex items-center justify-end gap-2 flex-wrap">
                <button
                  v-if="order.status === 'pending_qc'"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warn-orange text-white text-xs font-medium hover:bg-warn-orange/80 transition-colors"
                  @click="handleStartQc(order.id)"
                >
                  <Play :size="14" />
                  开始质检
                </button>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pass-green text-white text-xs font-medium hover:bg-pass-green/80 transition-colors"
                  @click="handlePass(order.id)"
                >
                  <CheckCircle :size="14" />
                  放行
                </button>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-red text-white text-xs font-medium hover:bg-danger-red/80 transition-colors"
                  @click="openRejectModal(order.id)"
                >
                  <XCircle :size="14" />
                  退回
                </button>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-warn-yellow text-warn-yellow text-xs font-medium hover:bg-warn-yellow/10 transition-colors"
                  @click="openExceptionModal(order.id)"
                >
                  <AlertTriangle :size="14" />
                  标记异常
                </button>
              </div>
              <div v-else-if="order.status === 'rejected'" class="space-y-1">
                <p class="text-danger-red text-xs">{{ order.rejectionReason }}</p>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-flow-blue/20 text-flow-blue text-xs font-medium hover:bg-flow-blue/30 transition-colors"
                  @click="handleReassign(order.id)"
                >
                  重新分配
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="7" class="py-8 text-center text-gray-500">暂无工单</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalDialog v-model="showRejectModal" title="退回工单">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">退回原因</label>
          <textarea
            v-model="rejectionReason"
            rows="4"
            class="w-full bg-factory-bg border border-factory-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-warn-orange transition-colors resize-none"
            placeholder="请输入退回原因..."
          />
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            @click="showRejectModal = false"
          >
            取消
          </button>
          <button
            :disabled="!rejectionReason.trim()"
            class="px-4 py-2 rounded-lg bg-danger-red text-white text-sm font-medium hover:bg-danger-red/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="submitRejection"
          >
            确认退回
          </button>
        </div>
      </div>
    </ModalDialog>

    <ModalDialog v-model="showExceptionModal" title="标记异常">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">异常类型</label>
          <select
            v-model="exceptionForm.type"
            class="w-full bg-factory-bg border border-factory-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-warn-orange transition-colors"
          >
            <option v-for="opt in exceptionTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">严重程度</label>
          <select
            v-model="exceptionForm.severity"
            class="w-full bg-factory-bg border border-factory-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-warn-orange transition-colors"
          >
            <option v-for="opt in exceptionSeverityOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">描述</label>
          <textarea
            v-model="exceptionForm.description"
            rows="4"
            class="w-full bg-factory-bg border border-factory-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-warn-orange transition-colors resize-none"
            placeholder="请输入异常描述..."
          />
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            @click="showExceptionModal = false"
          >
            取消
          </button>
          <button
            :disabled="!exceptionForm.description.trim()"
            class="px-4 py-2 rounded-lg bg-warn-yellow text-factory-bg text-sm font-medium hover:bg-warn-yellow/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="submitException"
          >
            确认标记
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>
