<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900">装修进场审批</h2>
      <div class="flex items-center gap-2">
        <div class="text-xs text-gray-500">
          装修状态：
          <span
            class="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="decoBadgeClass"
          >
            {{ decoStatusLabel }}
          </span>
        </div>
        <div class="h-4 w-px bg-gray-200 mx-1"></div>
        <template v-if="userRole === 'property_engineer' && record.currentStatus === 'decoration_pending'">
          <button @click="$emit('action', 'approve')" class="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
            ✓ 通过装修
          </button>
        </template>
        <template v-if="record.currentStatus === 'decoration_approved' || record.currentStatus === 'completed'">
          <span class="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
            ✓ 装修许可已发放
          </span>
        </template>
      </div>
    </div>

    <div v-if="record.currentStatus === 'contract_approved'" class="bg-sky-50 border border-sky-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">🏗️</span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-sky-800 mb-1">合同已签订，等待客户提交装修申请</p>
          <p class="text-xs text-sky-700 leading-relaxed">
            物业工程收到客户装修设计方案后，在此录入装修需求、风险点。审批通过后方可进场施工。
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
      <div>
        <p class="text-xs text-gray-500 mb-1">装修申请日期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.applyDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">预计开工</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.expectedStartDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">预计完工</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.expectedCompleteDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">方案提交日期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.planSubmitDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">审批通过日期</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.approvedDate || '—' }}</span>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">工程负责</p>
        <span class="text-sm font-medium text-gray-800">{{ record.decoration.engineerInCharge || '—' }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <div class="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
        <h4 class="text-xs font-semibold text-emerald-800 mb-2">✅ 装修需求（{{ record.decoration.requirements?.length || 0 }} 项）</h4>
        <ul class="space-y-1.5">
          <li v-for="(r, i) in record.decoration.requirements" :key="i" class="text-xs text-emerald-700 flex items-start gap-1.5">
            <span class="mt-1 w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>
            {{ r }}
          </li>
          <li v-if="!record.decoration.requirements?.length" class="text-xs text-emerald-500/60">暂无</li>
        </ul>
      </div>
      <div class="bg-red-50/50 border border-red-100 rounded-lg p-4">
        <h4 class="text-xs font-semibold text-red-800 mb-2">⚠️ 风险提示（{{ record.decoration.risks?.length || 0 }} 项）</h4>
        <ul class="space-y-1.5">
          <li v-for="(r, i) in record.decoration.risks" :key="i" class="text-xs text-red-700 flex items-start gap-1.5">
            <span class="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
            {{ r }}
          </li>
          <li v-if="!record.decoration.risks?.length" class="text-xs text-red-500/60">暂无风险</li>
        </ul>
      </div>
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

const decoBadgeClass = computed(() => {
  const s = props.record.currentStatus
  if (s === 'decoration_pending') return 'bg-amber-50 text-amber-700'
  if (s === 'decoration_approved') return 'bg-emerald-50 text-emerald-700'
  if (s === 'completed') return 'bg-purple-50 text-purple-700'
  return 'bg-gray-100 text-gray-500'
})
const decoStatusLabel = computed(() => {
  const s = props.record.currentStatus
  if (s.startsWith('decoration_')) return getStatusMeta(s as any).label
  if (s === 'completed') return '已入驻'
  if (['contract_approved', 'contract_pending', 'contract_rejected', 'plan_approved'].includes(s))
    return '未申请'
  return '未启动'
})
</script>
