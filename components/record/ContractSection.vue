<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900">合同审批详情</h2>
      <div class="flex items-center gap-2">
        <div class="text-xs text-gray-500">
          合同状态：
          <span
            class="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="contractBadgeClass"
          >
            {{ contractStatusLabel }}
          </span>
        </div>
        <div class="h-4 w-px bg-gray-200 mx-1"></div>
        <template v-if="userRole === 'manager' && record.currentStatus === 'contract_pending'">
          <button @click="$emit('action', 'approve')" class="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
            ✓ 通过合同
          </button>
          <button @click="$emit('action', 'reject')" class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium">
            ✗ 退回合同
          </button>
        </template>
        <template v-else-if="userRole === 'supervisor' && record.currentStatus === 'contract_rejected'">
          <button @click="$emit('action', 'resubmit')" class="px-3 py-1.5 text-xs rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-medium">
            ↻ 重提合同
          </button>
        </template>
        <template v-else-if="userRole === 'supervisor' && record.currentStatus === 'plan_approved'">
          <button @click="$emit('action', 'submit')" class="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">
            + 提交合同审批
          </button>
        </template>
        <template v-if="['contract_approved', 'decoration_pending', 'decoration_approved', 'completed'].includes(record.currentStatus)">
          <span class="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
            ✓ 合同已签
            <span v-if="contractApprovedTime" class="text-emerald-500 opacity-80">· {{ contractApprovedTime }}</span>
          </span>
        </template>
      </div>
    </div>

    <div v-if="record.currentStatus === 'plan_approved' && !record.contract.contractNo" class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">📝</span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-indigo-800 mb-1">租赁方案已通过，请准备合同条款</p>
          <p class="text-xs text-indigo-700 leading-relaxed">
            合同条款应严格对应租赁方案内容，如租金单价、免租期口径、租期年限、付款方式等。
            方案切换到合同时，责任人和历史说明会自动继承，不会丢失。
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <div>
        <p class="text-xs text-gray-500 mb-1">合同编号</p>
        <span class="text-sm font-medium text-gray-800 font-mono">{{ record.contract.contractNo || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">签署日期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.signedDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">合同起期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.startDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">合同止期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.endDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">甲方</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.partyA }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">乙方</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.partyB }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">乙方法定代表人</p>
        <span class="text-sm font-medium text-gray-800">{{ record.contract.legalRepresentative || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">签署人</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="s in record.contract.signers"
            :key="s"
            class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
          >{{ s }}</span>
          <span v-if="!record.contract.signers.length" class="text-sm text-gray-400">—</span>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 class="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
        <span>📌</span> 方案-合同条款核对（自动继承自租赁方案）
      </h4>
      <div class="grid grid-cols-4 gap-3 text-xs">
        <div class="p-2 bg-white rounded border border-gray-100">
          <p style="font-size: 10px;" class="text-gray-400 uppercase tracking-wide">月租金单价</p>
          <p class="text-xs font-medium text-gray-800 mt-0.5">{{ record.plan.monthlyRent }} {{ record.plan.rentUnit }}</p>
        </div>
        <div class="p-2 bg-white rounded border border-gray-100">
          <p style="font-size: 10px;" class="text-gray-400 uppercase tracking-wide">免租期</p>
          <p class="text-xs font-medium text-gray-800 mt-0.5">{{ record.plan.freeRentMonths }}个月</p>
        </div>
        <div class="p-2 bg-white rounded border border-gray-100">
          <p style="font-size: 10px;" class="text-gray-400 uppercase tracking-wide">租期</p>
          <p class="text-xs font-medium text-gray-800 mt-0.5">{{ record.plan.leaseYears }}年</p>
        </div>
        <div class="p-2 bg-white rounded border border-gray-100">
          <p style="font-size: 10px;" class="text-gray-400 uppercase tracking-wide">付款方式</p>
          <p class="text-xs font-medium text-gray-800 mt-0.5">{{ record.plan.paymentMethod || '-' }}</p>
        </div>
      </div>
    </div>

    <div v-if="lastContractReject" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-red-700">⚠️ 最近一次合同退回原因（{{ lastContractReject.operator.name }}）</p>
        <span class="text-xs text-red-500">{{ formatShort(lastContractReject.timestamp) }}</span>
      </div>
      <p class="text-sm text-red-600 leading-relaxed whitespace-pre-wrap">{{ lastContractReject.rejectReason }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LeaseRecord } from '~/types/lease'
import { getStatusMeta } from '~/utils/constants'
import { useLeaseStore } from '~/stores/lease'

const props = defineProps<{ record: LeaseRecord }>()
defineEmits<{ (e: 'action', mode: string): void }>()

const store = useLeaseStore()
const userRole = computed(() => store.currentUser.role)

const contractBadgeClass = computed(() => {
  const s = props.record.currentStatus
  if (s === 'contract_pending') return 'bg-amber-50 text-amber-700'
  if (s === 'contract_rejected') return 'bg-red-50 text-red-700'
  if (s === 'plan_approved') return 'bg-sky-50 text-sky-700'
  if (s === 'decoration_pending') return 'bg-sky-50 text-sky-700'
  if (['contract_approved', 'decoration_approved', 'completed'].includes(s))
    return 'bg-emerald-50 text-emerald-700'
  return 'bg-gray-100 text-gray-500'
})
const contractStatusLabel = computed(() => {
  const s = props.record.currentStatus
  if (s === 'plan_approved') return '待提交合同'
  if (s === 'contract_pending' || s === 'contract_rejected' || s === 'contract_approved') return getStatusMeta(s as any).label
  if (s === 'decoration_pending') return '已签订·已流转装修审批'
  if (s === 'decoration_approved' || s === 'completed') return '已签订'
  if (s.startsWith('plan_')) return '方案阶段'
  return '待启动'
})
const contractApprovedTime = computed(() => {
  const h = props.record.statusHistory.find(x => x.toStatus === 'contract_approved')
  return h ? formatShort(h.timestamp) : ''
})
const lastContractReject = computed(() => {
  const rs = props.record.statusHistory.filter(h => h.toStatus === 'contract_rejected')
  return rs.length ? rs[rs.length - 1] : null
})

function formatShort(iso: string) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
