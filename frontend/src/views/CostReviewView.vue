<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReplacementsStore } from '@/stores/replacements'
import { useUserStore } from '@/stores/user'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatMoney, formatDateTime } from '@/utils/format'
import {
  Search,
  RotateCcw,
  Download,
  ChevronRight,
  Filter,
} from 'lucide-vue-next'
import type { Replacement } from '@/types'

const router = useRouter()
const replacementsStore = useReplacementsStore()
const userStore = useUserStore()

const filters = ref({
  dateStart: '',
  dateEnd: '',
  customerName: '',
  amountMin: '',
  amountMax: '',
  confirmResult: 'all',
})

const customers = computed(() => {
  const list = new Set<string>()
  replacementsStore.replacements.forEach((r) => list.add(r.customerName))
  return Array.from(list)
})

const filteredList = computed(() => {
  let result = replacementsStore.replacements.filter((r) => {
    if (r.status === 'draft') return false
    if (!r.confirmedAt && r.status !== 'rejected') return false
    return true
  })

  if (filters.value.dateStart) {
    result = result.filter((r) => {
      const date = new Date(r.confirmedAt || r.updatedAt)
      return date >= new Date(filters.value.dateStart)
    })
  }
  if (filters.value.dateEnd) {
    result = result.filter((r) => {
      const date = new Date(r.confirmedAt || r.updatedAt)
      return date <= new Date(filters.value.dateEnd + 'T23:59:59')
    })
  }
  if (filters.value.customerName) {
    result = result.filter((r) => r.customerName === filters.value.customerName)
  }
  if (filters.value.amountMin) {
    const min = Number(filters.value.amountMin)
    result = result.filter((r) => (r.confirmedAmount ?? r.estimatedAmount) >= min)
  }
  if (filters.value.amountMax) {
    const max = Number(filters.value.amountMax)
    result = result.filter((r) => (r.confirmedAmount ?? r.estimatedAmount) <= max)
  }
  if (filters.value.confirmResult === 'confirmed') {
    result = result.filter((r) => r.status === 'confirmed' || r.status === 'closed')
  } else if (filters.value.confirmResult === 'rejected') {
    result = result.filter((r) => r.status === 'rejected')
  }

  return result
})

const summary = computed(() => {
  const list = filteredList.value
  const totalApply = list.reduce((sum, r) => sum + r.estimatedAmount, 0)
  const totalConfirm = list.reduce(
    (sum, r) => sum + (r.confirmedAmount ?? r.estimatedAmount),
    0
  )
  const diff = totalConfirm - totalApply
  const rejectCount = list.filter((r) => r.status === 'rejected').length
  const missingAttachmentCount = list.filter(
    (r) => r.attachments.length === 0 && r.status !== 'draft'
  ).length

  return {
    totalApply,
    totalConfirm,
    diff,
    rejectCount,
    missingAttachmentCount,
  }
})

function handleReset() {
  filters.value = {
    dateStart: '',
    dateEnd: '',
    customerName: '',
    amountMin: '',
    amountMax: '',
    confirmResult: 'all',
  }
}

function handleRowClick(r: Replacement) {
  replacementsStore.selectedId = r.id
  router.push('/replacements')
}

function handleExport() {
  const list = filteredList.value
  const headers = [
    '记录编号',
    '电梯编号',
    '设备型号',
    '客户名称',
    '申请金额',
    '确认金额',
    '差异',
    '申请人',
    '确认人',
    '确认时间',
    '客户反馈',
    '状态',
  ]
  const rows = list.map((r) => {
    const confirm = r.confirmedAmount ?? r.estimatedAmount
    const diff = confirm - r.estimatedAmount
    const statusMap: Record<string, string> = {
      pending_confirm: '待确认',
      confirmed: '已确认',
      rejected: '已退回',
      resubmitted: '已重新提交',
      completed: '已完成',
      closed: '已关闭',
    }
    return [
      r.orderNo,
      r.elevatorNo,
      r.deviceModel,
      r.customerName,
      r.estimatedAmount.toFixed(2),
      confirm.toFixed(2),
      diff.toFixed(2),
      r.technicianName,
      r.confirmedAt ? '系统' : '-',
      r.confirmedAt || r.updatedAt,
      r.customerFeedback || '',
      statusMap[r.status] || r.status,
    ]
  })

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
      '\n'
    )

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `费用确认回看_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getDiffClass(diff: number): string {
  if (diff < 0) return 'text-red-600'
  if (diff > 0) return 'text-green-600'
  return 'text-gray-700'
}

function getConfirmerName(r: Replacement): string {
  if (r.costConfirmations.length === 0) return '-'
  return r.costConfirmations[r.costConfirmations.length - 1].confirmerName
}

onMounted(() => {
  replacementsStore.initReplacements()
  userStore.initUser()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">费用确认回看</h1>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          @click="handleExport"
        >
          <Download :size="16" />
          导出
        </button>
      </div>

      <div class="bg-white border border-gray-200 p-4">
        <div class="flex items-center gap-2 mb-3">
          <Filter :size="16" class="text-gray-500" />
          <span class="text-sm font-medium text-gray-700">筛选条件</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">开始日期</label>
            <input
              v-model="filters.dateStart"
              type="date"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">结束日期</label>
            <input
              v-model="filters.dateEnd"
              type="date"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">客户</label>
            <select
              v-model="filters.customerName"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">全部</option>
              <option v-for="c in customers" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">金额最小</label>
            <input
              v-model="filters.amountMin"
              type="number"
              placeholder="0"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">金额最大</label>
            <input
              v-model="filters.amountMax"
              type="number"
              placeholder="不限"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">确认结果</label>
            <select
              v-model="filters.confirmResult"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">全部</option>
              <option value="confirmed">已确认</option>
              <option value="rejected">已退回</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900 text-white text-sm font-medium border border-blue-900 hover:bg-blue-800 transition-colors"
          >
            <Search :size="14" />
            搜索
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            @click="handleReset"
          >
            <RotateCcw :size="14" />
            重置
          </button>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-4">
        <div class="bg-white border border-gray-200 p-4">
          <div class="text-sm text-gray-500 mb-1">申请总金额</div>
          <div class="text-2xl font-bold text-gray-900 text-right">
            {{ formatMoney(summary.totalApply) }}
          </div>
        </div>
        <div class="bg-white border border-gray-200 p-4">
          <div class="text-sm text-gray-500 mb-1">确认总金额</div>
          <div class="text-2xl font-bold text-gray-900 text-right">
            {{ formatMoney(summary.totalConfirm) }}
          </div>
        </div>
        <div class="bg-white border border-gray-200 p-4">
          <div class="text-sm text-gray-500 mb-1">差异金额</div>
          <div
            class="text-2xl font-bold text-right"
            :class="getDiffClass(summary.diff)"
          >
            {{ summary.diff >= 0 ? '+' : '' }}{{ formatMoney(summary.diff) }}
          </div>
        </div>
        <div class="bg-white border border-gray-200 p-4">
          <div class="text-sm text-gray-500 mb-1">退回笔数</div>
          <div class="text-2xl font-bold text-red-600 text-right">
            {{ summary.rejectCount }}
          </div>
        </div>
        <div class="bg-white border border-gray-200 p-4">
          <div class="text-sm text-gray-500 mb-1">缺少附件</div>
          <div class="text-2xl font-bold text-orange-600 text-right">
            {{ summary.missingAttachmentCount }}
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">记录编号</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">电梯编号</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">客户名称</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">设备型号</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">更换原因</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">现场情况</th>
                <th class="px-3 py-2.5 text-right font-medium text-gray-600">申请金额</th>
                <th class="px-3 py-2.5 text-right font-medium text-gray-600">确认金额</th>
                <th class="px-3 py-2.5 text-right font-medium text-gray-600">差异</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">申请人</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">确认人</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">确认时间</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">客户反馈</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">状态</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">退回原因</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">补充备注</th>
                <th class="px-3 py-2.5 text-left font-medium text-gray-600">附件</th>
                <th class="px-3 py-2.5 text-right font-medium text-gray-600 w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in filteredList"
                :key="r.id"
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                :class="replacementsStore.isDisputeProne(r) ? 'border-l-4 border-l-orange-500' : ''"
                @click="handleRowClick(r)"
              >
                <td class="px-3 py-2.5 font-mono text-gray-900">{{ r.orderNo }}</td>
                <td class="px-3 py-2.5 text-gray-800 font-mono text-xs">{{ r.elevatorNo || '-' }}</td>
                <td class="px-3 py-2.5 text-gray-700">{{ r.customerName }}</td>
                <td class="px-3 py-2.5 text-gray-700 whitespace-nowrap">{{ r.deviceModel }}</td>
                <td class="px-3 py-2.5 text-gray-700 max-w-[180px] truncate" :title="r.replaceReason">
                  {{ r.replaceReason || '-' }}
                </td>
                <td class="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" :title="r.sceneDescription">
                  {{ r.sceneDescription || '-' }}
                </td>
                <td class="px-3 py-2.5 text-right text-gray-900">
                  {{ formatMoney(r.estimatedAmount) }}
                </td>
                <td class="px-3 py-2.5 text-right text-gray-900">
                  {{ formatMoney(r.confirmedAmount ?? r.estimatedAmount) }}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-medium"
                  :class="getDiffClass((r.confirmedAmount ?? r.estimatedAmount) - r.estimatedAmount)"
                >
                  {{ (r.confirmedAmount ?? r.estimatedAmount) - r.estimatedAmount >= 0 ? '+' : '' }}
                  {{ formatMoney((r.confirmedAmount ?? r.estimatedAmount) - r.estimatedAmount) }}
                </td>
                <td class="px-3 py-2.5 text-gray-700">{{ r.technicianName }}</td>
                <td class="px-3 py-2.5 text-gray-700">{{ getConfirmerName(r) }}</td>
                <td class="px-3 py-2.5 text-gray-600">
                  {{ formatDateTime(r.confirmedAt || r.updatedAt) }}
                </td>
                <td class="px-3 py-2.5 text-gray-600 max-w-[180px] truncate">
                  {{ r.customerFeedback || '-' }}
                </td>
                <td class="px-3 py-2.5">
                  <StatusBadge :status="r.status" />
                </td>
                <td class="px-3 py-2.5 text-gray-600 max-w-[180px] truncate">
                  {{ r.rejectRecords.length > 0 ? r.rejectRecords[r.rejectRecords.length - 1].reason.slice(0, 30) + (r.rejectRecords[r.rejectRecords.length - 1].reason.length > 30 ? '...' : '') : '-' }}
                </td>
                <td class="px-3 py-2.5">
                  <span v-if="r.supplementNotes.length > 0" class="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium border border-blue-300">{{ r.supplementNotes.length }}条</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-3 py-2.5">
                  <span v-if="r.attachments.length > 0" class="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium border border-green-300">{{ r.attachments.length }}件</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-900 border border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
                    @click.stop="handleRowClick(r)"
                  >
                    详情
                    <ChevronRight :size="12" />
                  </button>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="18" class="px-4 py-12 text-center text-gray-500">
                  暂无符合条件的记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
