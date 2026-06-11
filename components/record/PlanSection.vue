<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900">租赁方案详情</h2>
      <div class="flex items-center gap-2">
        <div class="text-xs text-gray-500">
          方案状态：
          <span
            class="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="planBadgeClass"
          >
            {{ planStatusLabel }}
          </span>
        </div>
        <div class="h-4 w-px bg-gray-200 mx-1"></div>
        <template v-if="userRole === 'manager' && record.currentStatus === 'plan_pending'">
          <button @click="$emit('action', 'approve')" class="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
            ✓ 通过方案
          </button>
          <button @click="$emit('action', 'reject')" class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium">
            ✗ 退回方案
          </button>
        </template>
        <template v-else-if="userRole === 'supervisor' && record.currentStatus === 'plan_rejected'">
          <button @click="$emit('action', 'resubmit')" class="px-3 py-1.5 text-xs rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-medium">
            ↻ 重新提交方案
          </button>
        </template>
        <template v-else-if="userRole === 'supervisor' && ['lead_created', 'lead_following'].includes(record.currentStatus)">
          <button @click="$emit('action', 'submit')" class="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">
            + 提交方案
          </button>
        </template>
        <template v-else-if="['plan_approved', 'contract_pending', 'contract_approved', 'contract_rejected'].includes(record.currentStatus)">
          <span class="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
            ✓ 方案已通过
            <span v-if="planApprovedTime" class="text-emerald-500 opacity-80">· {{ planApprovedTime }}</span>
          </span>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
      <div class="col-span-1 space-y-4">
        <div>
          <p class="text-xs text-gray-500 mb-1">月租金单价</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-gray-900">{{ valueOrDefault(record.plan.monthlyRent) }}</span>
            <span class="text-xs text-gray-500">{{ record.plan.rentUnit }}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">月租金合计 ≈ ¥{{ monthlyTotal }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">免租期</p>
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold text-amber-600">{{ valueOrDefault(record.plan.freeRentMonths) }}</span>
            <span class="text-xs text-gray-500">个月</span>
          </div>
          <p v-if="record.plan.freeRentRemark" class="text-xs text-amber-700 mt-1 bg-amber-50 rounded p-2 border border-amber-100 leading-relaxed">
            📌 {{ record.plan.freeRentRemark }}
          </p>
          <p v-else class="text-xs text-gray-400 mt-1">未填写免租说明</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">租期</p>
          <span class="text-lg font-semibold text-gray-800">{{ valueOrDefault(record.plan.leaseYears) }} 年</span>
        </div>
      </div>
      <div class="col-span-2 grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500 mb-1">押金（月）</p>
          <span class="text-sm font-medium text-gray-800">{{ valueOrDefault(record.plan.depositMonths) }} 个月租金</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">递增幅度</p>
          <span class="text-sm font-medium text-gray-800">{{ record.plan.increaseRate || '—' }}</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">付款方式</p>
          <span class="text-sm font-medium text-gray-800">{{ record.plan.paymentMethod || '—' }}</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">装修期</p>
          <span class="text-sm font-medium text-gray-800">{{ valueOrDefault(record.plan.decorationDays) }} 天</span>
        </div>
        <div class="col-span-2">
          <p class="text-xs text-gray-500 mb-1">提前解约违约金</p>
          <span class="text-sm font-medium text-gray-800">{{ record.plan.earlyTerminationPenalty || '—' }}</span>
        </div>
      </div>
    </div>

    <div v-if="lastPlanReject" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-red-700">⚠️ 最近一次退回原因（{{ lastPlanReject.operator.name }}）</p>
        <span class="text-xs text-red-500">{{ formatShort(lastPlanReject.timestamp) }}</span>
      </div>
      <p class="text-sm text-red-600 leading-relaxed whitespace-pre-wrap">{{ lastPlanReject.rejectReason }}</p>
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

function valueOrDefault(v: number | string) {
  return v || v === 0 ? v : '—'
}

const monthlyTotal = computed(() => {
  const r = props.record.plan.monthlyRent || 0
  const a = props.record.area || 0
  return Math.round(r * a).toLocaleString()
})

const planBadgeClass = computed(() => {
  const s = props.record.currentStatus
  if (s === 'plan_pending') return 'bg-amber-50 text-amber-700'
  if (s === 'plan_rejected') return 'bg-red-50 text-red-700'
  if (s === 'plan_approved') return 'bg-sky-50 text-sky-700'
  if (['contract_pending', 'contract_approved', 'contract_rejected', 'decoration_pending', 'decoration_approved', 'completed'].includes(s))
    return 'bg-emerald-50 text-emerald-700'
  return 'bg-gray-100 text-gray-600'
})
const planStatusLabel = computed(() => {
  const s = props.record.currentStatus
  if (s.startsWith('plan_')) return s === 'plan_approved' ? '已通过·待起草合同' : getStatusMeta(s as any).label
  if (s.startsWith('contract_') || s.startsWith('decoration_') || s === 'completed')
    return '已通过·已流转合同'
  return '未提交'
})
const planApprovedTime = computed(() => {
  const h = props.record.statusHistory.find(x => x.toStatus === 'plan_approved')
  return h ? formatShort(h.timestamp) : ''
})
const lastPlanReject = computed(() => {
  const rs = props.record.statusHistory.filter(h => h.toStatus === 'plan_rejected')
  return rs.length ? rs[rs.length - 1] : null
})

function formatShort(iso: string) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
