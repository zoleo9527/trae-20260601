<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="s in statusSummary"
        :key="s.status"
        class="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-sm hover:border-indigo-200"
        :class="{ 'ring-2 ring-indigo-500 border-transparent': activeFilter === s.status }"
        @click="setFilter(s.status)"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">{{ s.label }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="s.tagClass">{{ s.roleHint }}</span>
        </div>
        <p class="text-3xl font-bold" :class="s.textClass">{{ s.count }}</p>
        <p class="text-xs text-gray-500 mt-1">我的待办 · 共 {{ s.total }} 条</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-5 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          @click="setFilter(f.value)"
          class="px-3 py-1.5 text-sm rounded-lg transition"
          :class="activeFilter === f.value
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'"
        >
          {{ f.label }}
          <span class="ml-1 text-xs opacity-70">{{ '(' + f.count + ')' }}</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="store.selectedIds.length" class="flex items-center gap-2 mr-2">
          <span class="text-sm text-gray-600">
            已选 <b class="text-indigo-600">{{ store.selectedIds.length }}</b> 条
          </span>
          <button
            v-if="canBatchAdvance"
            @click="showBatchModal = true"
            class="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            批量推进
          </button>
          <button
            @click="store.clearSelection()"
            class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            清除选择
          </button>
        </div>
        <div class="relative">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索企业/联系人/房间"
            class="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr class="text-left text-gray-500 text-xs uppercase tracking-wide">
            <th class="w-10 py-3 pl-5">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleAll"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
            <th class="py-3">编号 / 企业</th>
            <th class="py-3">位置 / 面积</th>
            <th class="py-3">产业 / 用途</th>
            <th class="py-3">租赁方案要点</th>
            <th class="py-3">状态</th>
            <th class="py-3">责任人</th>
            <th class="py-3">创建时间</th>
            <th class="py-3 pr-5 w-32">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="rec in filteredRecords"
            :key="rec.id"
            class="hover:bg-indigo-50/60 transition"
            :class="{ 'bg-amber-50/60': store.selectedIds.includes(rec.id) }"
          >
            <td class="py-4 pl-5">
              <input
                type="checkbox"
                :checked="store.selectedIds.includes(rec.id)"
                @change="store.toggleSelected(rec.id)"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </td>
            <td class="py-4">
              <div class="flex flex-col">
                <span class="text-xs text-gray-400 font-mono">{{ rec.recordNo }}</span>
                <span class="font-semibold text-gray-900 cursor-pointer hover:text-indigo-600" @click="goDetail(rec.id)">
                  {{ rec.companyName }}
                </span>
                <span class="text-xs text-gray-500">{{ rec.contactName }} · {{ rec.contactPhone }}</span>
              </div>
            </td>
            <td class="py-4 text-gray-700">
              <p>{{ rec.building }} · {{ rec.floor }} · {{ rec.room }}</p>
              <p class="text-xs text-gray-500">{{ rec.area }} ㎡</p>
            </td>
            <td class="py-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{{ rec.industry }}</span>
              <p class="text-xs text-gray-500 mt-1">{{ rec.intendedUse }}</p>
            </td>
            <td class="py-4">
              <div class="text-gray-700" v-if="rec.plan.monthlyRent">
                <p>
                  <b>{{ rec.plan.monthlyRent }}</b> {{ rec.plan.rentUnit }}
                </p>
                <p class="text-xs text-gray-500">
                  免{{ rec.plan.freeRentMonths }}月 · {{ rec.plan.leaseYears }}年 · {{ rec.plan.paymentMethod }}
                </p>
              </div>
              <span v-else class="text-xs text-gray-400">方案未提交</span>
            </td>
            <td class="py-4">
              <button
                @click="setStatusFilter(rec.currentStatus)"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                :class="statusClass(rec.currentStatus)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(rec.currentStatus)"></span>
                {{ statusLabel(rec.currentStatus) }}
              </button>
            </td>
            <td class="py-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">
                  {{ rec.currentHandler?.name?.charAt(0) }}
                </div>
                <div class="text-xs">
                  <p class="text-gray-800 font-medium">{{ rec.currentHandler?.name || '-' }}</p>
                  <p class="text-gray-400">{{ rec.currentHandler ? roleLabel(rec.currentHandlerRole!) : '-' }}</p>
                </div>
              </div>
            </td>
            <td class="py-4 text-gray-500 text-xs">
              {{ formatDate(rec.createTime) }}
            </td>
            <td class="py-4 pr-5">
              <div class="flex items-center gap-2">
                <button
                  @click="goDetail(rec.id)"
                  class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  查看
                </button>
                <button
                  v-if="hasQuickAction(rec)"
                  @click="quickAction(rec)"
                  class="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                >
                  {{ quickActionLabel(rec) }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!filteredRecords.length" class="py-20 text-center text-gray-400">
        <p class="text-lg">暂无记录</p>
      </div>
    </div>

    <LeaseBatchModal
      v-if="showBatchModal"
      :ids="store.selectedIds"
      @close="showBatchModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeaseStore } from '~/stores/lease'
import { STATUS_OPTIONS, getStatusMeta, getRoleLabel } from '~/utils/constants'
import type { LeaseRecord, LeaseStatus } from '~/types/lease'

const store = useLeaseStore()
const router = useRouter()

const activeFilter = ref<LeaseStatus | 'all' | 'todo'>('todo')
const keyword = ref('')
const showBatchModal = ref(false)

const roleLabel = getRoleLabel

const todoStatuses = computed<LeaseStatus[]>(() => {
  const r = store.currentUser.role
  if (r === 'manager') return ['plan_pending', 'contract_pending']
  if (r === 'supervisor') return ['plan_rejected', 'contract_rejected', 'lead_following', 'lead_created', 'plan_approved']
  if (r === 'property_engineer') return ['decoration_pending']
  return []
})

const TODO_LABEL: Partial<Record<LeaseStatus, { label: string; hint: string; cls: string; textCls: string }>> = {
  plan_pending: { label: '租赁方案待审批', hint: '招商经理待审批', cls: 'bg-amber-50 text-amber-700', textCls: 'text-amber-600' },
  contract_pending: { label: '合同审批中', hint: '招商经理待审批', cls: 'bg-amber-50 text-amber-700', textCls: 'text-amber-600' },
  plan_rejected: { label: '租赁方案已退回', hint: '待修改重提', cls: 'bg-red-50 text-red-700', textCls: 'text-red-600' },
  contract_rejected: { label: '合同已退回', hint: '待修改重提', cls: 'bg-red-50 text-red-700', textCls: 'text-red-600' },
  lead_following: { label: '线索跟进中', hint: '待提交方案', cls: 'bg-blue-50 text-blue-700', textCls: 'text-blue-600' },
  lead_created: { label: '新线索', hint: '待跟进', cls: 'bg-gray-100 text-gray-700', textCls: 'text-gray-700' },
  plan_approved: { label: '方案已通过·待起草合同', hint: '待提交合同审批', cls: 'bg-sky-50 text-sky-700', textCls: 'text-sky-600' },
  decoration_pending: { label: '装修进场待审批', hint: '物业工程待审核', cls: 'bg-amber-50 text-amber-700', textCls: 'text-amber-600' }
}

const filterOptions = computed(() => {
  const counts = (s: LeaseStatus | 'all' | 'todo') => {
    if (s === 'all') return store.records.length
    if (s === 'todo') return store.todoRecords.length
    return store.records.filter(r => r.currentStatus === s).length
  }
  const base = [
    { value: 'todo' as const, label: '我的待办', count: counts('todo') },
    { value: 'all' as const, label: '全部记录', count: counts('all') }
  ]
  const specific = STATUS_OPTIONS.map(o => ({
    value: o.value,
    label: o.label,
    count: counts(o.value)
  }))
  return [...base, ...specific]
})

const statusSummary = computed(() => {
  const myTodos = todoStatuses.value
  return myTodos.slice(0, 4).map(s => {
    const meta = TODO_LABEL[s] || getStatusMeta(s)
    const total = store.records.filter(r => r.currentStatus === s).length
    const mine = store.todoRecords.filter(r => r.currentStatus === s).length
    const label = (meta as any).label || (meta as any).label
    return {
      status: s,
      label,
      count: mine,
      total,
      tagClass: (meta as any).cls || 'bg-amber-50 text-amber-700',
      textClass: (meta as any).textCls || 'text-amber-600',
      roleHint: (meta as any).hint || '待处理'
    }
  })
})

const filteredRecords = computed(() => {
  let list = store.records
  if (activeFilter.value === 'todo') list = store.todoRecords
  else if (activeFilter.value !== 'all') list = list.filter(r => r.currentStatus === activeFilter.value)
  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    list = list.filter(r =>
      r.companyName.toLowerCase().includes(k) ||
      r.contactName.includes(k) ||
      r.room.includes(k) ||
      r.recordNo.toLowerCase().includes(k)
    )
  }
  return list
})

const allSelected = computed(() =>
  filteredRecords.value.length > 0 && filteredRecords.value.every(r => store.selectedIds.includes(r.id))
)

const canBatchAdvance = computed(() => {
  const ids = store.selectedIds
  if (!ids.length) return false
  const first = store.getRecord(ids[0])
  if (!first) return false
  return ids.every(id => {
    const r = store.getRecord(id)
    return r && r.currentStatus === first.currentStatus
  })
})

function setFilter(v: LeaseStatus | 'all' | 'todo') { activeFilter.value = v }
function setStatusFilter(s: LeaseStatus) { activeFilter.value = s }
function toggleAll() {
  if (allSelected.value) store.clearSelection()
  else store.selectAll(filteredRecords.value.map(r => r.id))
}

function goDetail(id: string) {
  router.push('/record/' + id)
}

function statusClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'bg-gray-100 text-gray-700',
    lead_following: 'bg-blue-50 text-blue-700',
    plan_pending: 'bg-amber-50 text-amber-700',
    plan_rejected: 'bg-red-50 text-red-700',
    plan_approved: 'bg-emerald-50 text-emerald-700',
    contract_pending: 'bg-amber-50 text-amber-700',
    contract_rejected: 'bg-red-50 text-red-700',
    contract_approved: 'bg-emerald-50 text-emerald-700',
    decoration_pending: 'bg-amber-50 text-amber-700',
    decoration_approved: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-purple-50 text-purple-700'
  }
  return map[s]
}
function dotClass(s: LeaseStatus) {
  const map: Record<LeaseStatus, string> = {
    lead_created: 'bg-gray-400',
    lead_following: 'bg-blue-500',
    plan_pending: 'bg-amber-500',
    plan_rejected: 'bg-red-500',
    plan_approved: 'bg-emerald-500',
    contract_pending: 'bg-amber-500',
    contract_rejected: 'bg-red-500',
    contract_approved: 'bg-emerald-500',
    decoration_pending: 'bg-amber-500',
    decoration_approved: 'bg-emerald-500',
    completed: 'bg-purple-500'
  }
  return map[s]
}
const statusLabel = (s: LeaseStatus) => getStatusMeta(s).label

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function hasQuickAction(r: LeaseRecord) {
  const role = store.currentUser.role
  const s = r.currentStatus
  if (role === 'manager') return ['plan_pending', 'contract_pending'].includes(s)
  if (role === 'supervisor') return ['plan_rejected', 'contract_rejected', 'plan_approved', 'lead_following'].includes(s)
  if (role === 'property_engineer') return s === 'decoration_pending'
  return false
}

function quickActionLabel(r: LeaseRecord) {
  const s = r.currentStatus
  if (s === 'plan_pending') return '审批方案'
  if (s === 'contract_pending') return '审批合同'
  if (s === 'plan_rejected') return '重新提交方案'
  if (s === 'contract_rejected') return '重提合同'
  if (s === 'plan_approved') return '提交合同'
  if (s === 'decoration_pending') return '审批装修'
  if (s === 'lead_following') return '提交方案'
  return '处理'
}

function quickAction(r: LeaseRecord) {
  router.push('/record/' + r.id + '?action=1')
}
</script>
